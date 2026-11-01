import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Session from "../../../src/models/session.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    MATCH_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestMatch,
    createTestSession
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMatches,
    cleanupTestNotifications,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SESSIONS_URL = `http://localhost:${PORT}/api/v1/sessions`

let server


const getFutureSchedule = (daysFromNow = 2) => {
    const futureDate = new Date(
        Date.now() + daysFromNow * 24 * 60 * 60 * 1000
    )

    const parts = new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        }
    ).formatToParts(futureDate)

    const getPart = (type) => parts.find(
        (part) => part.type === type
    ).value

    return {
        date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
        time: `${getPart("hour")}:${getPart("minute")}`
    }
}


const createSessionRequest = async (body, accessToken) => {
    try {
        return await axios.post(
            SESSIONS_URL,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSessions()
    await cleanupTestNotifications()
    await cleanupTestMatches()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSessions()
    await cleanupTestNotifications()
    await cleanupTestMatches()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Create Session", () => {

    test("Learner can create a Regular Session request", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(learner._id)

        await createTestMatch(
            learner._id,
            teacher._id,
            MATCH_STATUSES.ACCEPTED
        )

        const schedule = getFutureSchedule()

        const response = await createSessionRequest(
            {
                teacherId: teacher._id.toString(),
                skillId: skill._id.toString(),
                ...schedule,
                duration: SESSION_DURATIONS.ONE_HOUR,
                sessionType: SESSION_TYPES.REGULAR,
                credits: 10
            },
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Session request sent successfully"
        )
        expect(response.data.data.session.teacher).toBe(
            teacher._id.toString()
        )
        expect(response.data.data.session.learner).toBe(
            learner._id.toString()
        )
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.PENDING
        )
        expect(response.data.data.session.scheduledAt).toContain(
            "+05:30"
        )

        const savedSession = await Session.findById(
            response.data.data.session._id
        )

        expect(savedSession).not.toBeNull()
        expect(savedSession.sessionType).toBe(SESSION_TYPES.REGULAR)
        expect(savedSession.credits).toBe(10)

        const notification = await Notification.findOne({
            recipient: teacher._id,
            type: NOTIFICATION_TYPES.SESSION_REQUEST_RECEIVED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${learner.username} sent you a Session request`
        )
    })


    test("Learner can create a Demo Session request with zero credits", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(learner._id)

        await createTestMatch(
            learner._id,
            teacher._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await createSessionRequest(
            {
                teacherId: teacher._id.toString(),
                skillId: skill._id.toString(),
                ...getFutureSchedule(),
                duration: SESSION_DURATIONS.THIRTY_MINUTES,
                sessionType: SESSION_TYPES.DEMO,
                credits: 0
            },
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.data.session.sessionType).toBe(
            SESSION_TYPES.DEMO
        )
        expect(response.data.data.session.credits).toBe(0)
    })


    test("Learner cannot create Session without an accepted Match", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(learner._id)

        const response = await createSessionRequest(
            {
                teacherId: teacher._id.toString(),
                skillId: skill._id.toString(),
                ...getFutureSchedule(),
                duration: SESSION_DURATIONS.ONE_HOUR,
                sessionType: SESSION_TYPES.REGULAR,
                credits: 10
            },
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Session.countDocuments()).toBe(0)
    })


    test("Learner cannot request time overlapping their accepted Session", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const {user: otherTeacher} = await createTestTeacherLearner(
            skill._id
        )
        const accessToken = generateAccessToken(learner._id)

        await createTestMatch(
            learner._id,
            teacher._id,
            MATCH_STATUSES.ACCEPTED
        )

        const schedule = getFutureSchedule()
        const scheduledAt = new Date(
            `${schedule.date}T${schedule.time}:00+05:30`
        )

        await createTestSession(
            otherTeacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED,
            {
                scheduledAt
            }
        )

        const response = await createSessionRequest(
            {
                teacherId: teacher._id.toString(),
                skillId: skill._id.toString(),
                ...schedule,
                duration: SESSION_DURATIONS.ONE_HOUR,
                sessionType: SESSION_TYPES.REGULAR,
                credits: 10
            },
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.message).toBe(
            "You already have an accepted Session at this time"
        )
        expect(await Session.countDocuments()).toBe(1)
    })

})
