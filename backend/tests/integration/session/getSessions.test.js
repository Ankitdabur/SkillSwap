import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { SESSION_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSession
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SESSIONS_URL = `http://localhost:${PORT}/api/v1/sessions`

let server


const getSessionsByStatus = async (
    role,
    status,
    accessToken,
    query = {}
) => {
    try {
        return await axios.get(
            `${SESSIONS_URL}/me/${role}/${status}`,
            {
                ...authHeader(accessToken),
                params: query
            }
        )
    } catch (error) {
        return error.response
    }
}


const getSessionById = async (sessionId, accessToken) => {
    try {
        return await axios.get(
            `${SESSIONS_URL}/${sessionId}`,
            authHeader(accessToken)
        )
    } catch (error) {
        return error.response
    }
}


const getConflictingSessions = async (sessionId, accessToken) => {
    try {
        return await axios.get(
            `${SESSIONS_URL}/${sessionId}/conflicts`,
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
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get Sessions", () => {

    test("Teacher can get pending teaching Sessions with cursor pagination", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const firstSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt: new Date(
                    Date.now() + 2 * 24 * 60 * 60 * 1000
                )
            }
        )

        const secondSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt: new Date(
                    Date.now() + 3 * 24 * 60 * 60 * 1000
                )
            }
        )

        const accessToken = generateAccessToken(teacher._id)

        const firstResponse = await getSessionsByStatus(
            "teaching",
            "pending",
            accessToken,
            {
                limit: "1"
            }
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.data.sessions).toHaveLength(1)
        expect(firstResponse.data.data.sessions[0]._id).toBe(
            secondSession._id.toString()
        )
        expect(firstResponse.data.data.pagination.hasMore).toBe(true)
        expect(firstResponse.data.data.pagination.nextCursor).toBe(
            secondSession._id.toString()
        )

        const secondResponse = await getSessionsByStatus(
            "teaching",
            "pending",
            accessToken,
            {
                cursor: firstResponse.data.data.pagination.nextCursor,
                limit: "1"
            }
        )

        expect(secondResponse.status).toBe(200)
        expect(secondResponse.data.data.sessions).toHaveLength(1)
        expect(secondResponse.data.data.sessions[0]._id).toBe(
            firstSession._id.toString()
        )
        expect(secondResponse.data.data.pagination.hasMore).toBe(false)
    })


    test("Learner can get learning Sessions by status", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const acceptedSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt: new Date(
                    Date.now() + 3 * 24 * 60 * 60 * 1000
                )
            }
        )

        const accessToken = generateAccessToken(learner._id)

        const response = await getSessionsByStatus(
            "learning",
            "accepted",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.sessions).toHaveLength(1)
        expect(response.data.data.sessions[0]._id).toBe(
            acceptedSession._id.toString()
        )
        expect(response.data.data.sessions[0].scheduledAt).toContain(
            "+05:30"
        )
    })


    test("Only a Session participant can get Session details", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const learnerResponse = await getSessionById(
            session._id.toString(),
            generateAccessToken(learner._id)
        )

        expect(learnerResponse.status).toBe(200)
        expect(learnerResponse.data.data.session._id).toBe(
            session._id.toString()
        )

        const unrelatedResponse = await getSessionById(
            session._id.toString(),
            generateAccessToken(teacherLearner._id)
        )

        expect(unrelatedResponse.status).toBe(403)
        expect(unrelatedResponse.data.code).toBe(ERROR_CODES.FORBIDDEN)
    })


    test("Participant gets only their own active conflicting Sessions", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createSessionUsers()

        const scheduledAt = new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
        )

        const selectedSession = await createTestSession(
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

        await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.PENDING,
            {
                scheduledAt
            }
        )

        await createTestSession(
            teacherLearner._id,
            teacher._id,
            skill._id,
            SESSION_STATUSES.REJECTED,
            {
                scheduledAt
            }
        )

        const response = await getConflictingSessions(
            selectedSession._id.toString(),
            generateAccessToken(teacherLearner._id)
        )

        const conflictingSessionIds = response.data.data.conflictingSessions.map(
            (session) => session._id
        )

        expect(response.status).toBe(200)
        expect(conflictingSessionIds).toHaveLength(2)
        expect(conflictingSessionIds).toContain(
            teachingConflict._id.toString()
        )
        expect(conflictingSessionIds).toContain(
            learningConflict._id.toString()
        )
    })

})
