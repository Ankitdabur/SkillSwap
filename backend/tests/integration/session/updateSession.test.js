import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Session from "../../../src/models/session.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    NOTIFICATION_TYPES,
    SESSION_STATUSES
} from "../../../src/constants/enums.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSession
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestNotifications,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SESSIONS_URL = `http://localhost:${PORT}/api/v1/sessions`

let server


const patchSession = async (
    sessionId,
    action,
    accessToken,
    body = {}
) => {
    try {
        return await axios.patch(
            `${SESSIONS_URL}/${sessionId}/${action}`,
            body,
            authHeader(accessToken)
        )
    } catch (error) {
        return error.response
    }
}


const unsendSession = async (sessionId, accessToken) => {
    try {
        return await axios.delete(
            `${SESSIONS_URL}/${sessionId}/unsend`,
            authHeader(accessToken)
        )
    } catch (error) {
        return error.response
    }
}


const createSessionUsers = async () => {
    const skill = await createTestSkill(
        "test-session-skill",
        "Test Session Skill"
    )

    const {user: learner} = await createTestLearner()
    const {user: teacher} = await createTestTeacher(skill._id)
    const {user: teacherLearner} = await createTestTeacherLearner(
        skill._id
    )

    return {
        skill,
        learner,
        teacher,
        teacherLearner
    }
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSessions()
    await cleanupTestNotifications()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSessions()
    await cleanupTestNotifications()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Update Session", () => {

    test("Assigned teacher can accept a pending Session", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const response = await patchSession(
            session._id.toString(),
            "accept",
            generateAccessToken(teacher._id),
            {
                meetingLink: "https://meet.example.com/accepted-session",
                teacherResponse: "Ready for the Session"
            }
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.ACCEPTED
        )
        expect(response.data.data.session.teacherResponse).toBe(
            "Ready for the Session"
        )

        const savedSession = await Session.findById(session._id)

        expect(savedSession.status).toBe(SESSION_STATUSES.ACCEPTED)
        expect(savedSession.meetingLink).toBe(
            "https://meet.example.com/accepted-session"
        )

        const notification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_REQUEST_ACCEPTED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${teacher.username} accepted your Session request`
        )
    })


    test("Acceptance reports when both participants are busy", async () => {
        const {skill, learner, teacher} = await createSessionUsers()
        const scheduledAt = new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
        )

        await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED,
            {
                scheduledAt
            }
        )

        const pendingSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt
            }
        )

        const response = await patchSession(
            pendingSession._id.toString(),
            "accept",
            generateAccessToken(teacher._id),
            {
                meetingLink: "https://meet.example.com/pending-session"
            }
        )

        expect(response.status).toBe(409)
        expect(response.data.message).toBe(
            "Teacher and learner already have accepted Sessions at this time"
        )

        const savedSession = await Session.findById(pendingSession._id)

        expect(savedSession.status).toBe(SESSION_STATUSES.PENDING)
    })


    test("Assigned teacher can reject a pending Session", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const response = await patchSession(
            session._id.toString(),
            "reject",
            generateAccessToken(teacher._id),
            {
                teacherResponse: "Credit amount is too low"
            }
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.REJECTED
        )
        expect(response.data.data.session.teacherResponse).toBe(
            "Credit amount is too low"
        )

        const notification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_REQUEST_REJECTED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${teacher.username} rejected your Session request`
        )
    })


    test("Participant can handle only their own pending conflicts", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createSessionUsers()

        const scheduledAt = new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
        )

        const acceptedSession = await createTestSession(
            teacherLearner._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED,
            {
                scheduledAt
            }
        )

        const teachingConflict = await createTestSession(
            teacherLearner._id,
            teacher._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt
            }
        )

        const learningConflict = await createTestSession(
            teacher._id,
            teacherLearner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt
            }
        )

        const otherParticipantConflict = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt
            }
        )

        const response = await patchSession(
            acceptedSession._id.toString(),
            "reject-conflicts",
            generateAccessToken(teacherLearner._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data).toEqual({
            rejectedCount: 1,
            deletedCount: 1
        })

        const savedTeachingConflict = await Session.findById(
            teachingConflict._id
        )
        const savedLearningConflict = await Session.findById(
            learningConflict._id
        )
        const savedOtherConflict = await Session.findById(
            otherParticipantConflict._id
        )

        expect(savedTeachingConflict.status).toBe(
            SESSION_STATUSES.REJECTED
        )
        expect(savedLearningConflict).toBeNull()
        expect(savedOtherConflict.status).toBe(
            SESSION_STATUSES.PENDING
        )
    })


    test("Either participant can cancel an accepted Session before it starts", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        const response = await patchSession(
            session._id.toString(),
            "cancel",
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.CANCELLED
        )

        const notification = await Notification.findOne({
            recipient: teacher._id,
            type: NOTIFICATION_TYPES.SESSION_CANCELLED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${learner.username} cancelled your Session`
        )
    })


    test("Learner can unsend and delete their pending Session request", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const response = await unsendSession(
            session._id.toString(),
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session._id).toBe(
            session._id.toString()
        )
        expect(await Session.findById(session._id)).toBeNull()
    })

})
