import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Session from "../../../src/models/session.model.js"
import User from "../../../src/models/user.model.js"
import CreditTransaction from "../../../src/models/creditTransaction.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestAdmin,
    createTestCreditTransaction,
    createTestLearner,
    createTestSession,
    createTestSkill,
    createTestTeacher
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestCreditTransactions,
    cleanupTestNotifications,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const ADMIN_URL = `http://localhost:${PORT}/api/v1/admin`

let server


const getUnderReviewSessions = async (
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${ADMIN_URL}/sessions/under-review${query}`,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const getUnderReviewSessionById = async (
    sessionId,
    accessToken
) => {
    try {
        return await axios.get(
            `${ADMIN_URL}/sessions/under-review/${sessionId}`,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const resolveSessionReview = async (
    sessionId,
    body,
    accessToken
) => {
    try {
        return await axios.patch(
            `${ADMIN_URL}/sessions/under-review/${sessionId}/resolve`,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const createRegularReviewSession = async (
    teacher,
    learner,
    skill
) => {
    await User.findByIdAndUpdate(learner._id, {
        credits: 90,
        reservedCredits: 10
    })

    const session = await createTestSession(
        teacher._id,
        learner._id,
        skill._id,
        SESSION_STATUSES.UNDER_REVIEW
    )

    await createTestCreditTransaction(
        learner._id,
        session._id,
        -10
    )

    await createTestCreditTransaction(
        teacher._id,
        session._id,
        10
    )

    return session
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestCreditTransactions()
    await cleanupTestNotifications()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestCreditTransactions()
    await cleanupTestNotifications()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Admin Session Review", () => {

    test("Admin can get under-review Sessions with cursor pagination", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(admin._id)

        const firstSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.UNDER_REVIEW
        )

        const secondSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.UNDER_REVIEW
        )

        await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        const firstResponse = await getUnderReviewSessions(
            accessToken,
            "?limit=1"
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.success).toBe(true)
        expect(firstResponse.data.message).toBe(
            "Under-review Sessions fetched successfully"
        )
        expect(firstResponse.data.data.sessions).toHaveLength(1)
        expect(firstResponse.data.data.sessions[0]._id).toBe(
            secondSession._id.toString()
        )
        expect(firstResponse.data.data.sessions[0].teacher).toBeUndefined()
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondSession._id.toString(),
            hasMore: true
        })

        const secondResponse = await getUnderReviewSessions(
            accessToken,
            `?cursor=${secondSession._id}&limit=1`
        )

        expect(secondResponse.status).toBe(200)
        expect(secondResponse.data.data.sessions[0]._id).toBe(
            firstSession._id.toString()
        )
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: null,
            hasMore: false
        })
    })


    test("Admin can get one under-review Session with details", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.UNDER_REVIEW
        )

        const response = await getUnderReviewSessionById(
            session._id.toString(),
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session._id).toBe(
            session._id.toString()
        )
        expect(response.data.data.session.teacher.username).toBe(
            teacher.username
        )
        expect(response.data.data.session.learner.username).toBe(
            learner.username
        )
        expect(response.data.data.session.skill.name).toBe(skill.name)
    })


    test("Non-admin cannot access the Session review queue", async () => {
        const {user} = await createTestLearner()

        const response = await getUnderReviewSessions(
            generateAccessToken(user._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )
    })


    test("Admin can complete a regular Session exactly once", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(admin._id)

        const session = await createRegularReviewSession(
            teacher,
            learner,
            skill
        )

        const response = await resolveSessionReview(
            session._id.toString(),
            {
                resolution: SESSION_STATUSES.COMPLETED,
                adminResponse: "   Evidence confirms completion   "
            },
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.COMPLETED
        )
        expect(response.data.data.session.completionMethod).toBe(
            COMPLETION_METHODS.ADMIN
        )
        expect(response.data.data.session.adminResponse).toBe(
            "Evidence confirms completion"
        )

        const secondResponse = await resolveSessionReview(
            session._id.toString(),
            {
                resolution: SESSION_STATUSES.COMPLETED
            },
            accessToken
        )

        expect(secondResponse.status).toBe(409)

        const updatedLearner = await User.findById(learner._id)
        const updatedTeacher = await User.findById(teacher._id)
        const creditTransactions = await CreditTransaction.find({
            session: session._id
        })
        const completionNotifications = await Notification.countDocuments({
            type: NOTIFICATION_TYPES.SESSION_COMPLETED,
            recipient: {
                $in: [teacher._id, learner._id]
            }
        })

        expect(updatedLearner.credits).toBe(90)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(updatedTeacher.credits).toBe(10)
        expect(
            creditTransactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.COMPLETED,
            CREDIT_TRANSACTION_STATUSES.COMPLETED
        ])
        expect(completionNotifications).toBe(2)
    })


    test("Admin can cancel a regular Session and refund its reservation", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)

        const session = await createRegularReviewSession(
            teacher,
            learner,
            skill
        )

        const response = await resolveSessionReview(
            session._id.toString(),
            {
                resolution: SESSION_STATUSES.CANCELLED,
                adminResponse: "Session did not happen"
            },
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.CANCELLED
        )
        expect(response.data.data.session.completionMethod).toBeNull()

        const updatedLearner = await User.findById(learner._id)
        const updatedTeacher = await User.findById(teacher._id)
        const creditTransactions = await CreditTransaction.find({
            session: session._id
        })
        const refundNotification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_CREDITS_REFUNDED
        })

        expect(updatedLearner.credits).toBe(100)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(updatedTeacher.credits).toBe(0)
        expect(
            creditTransactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.CANCELLED,
            CREDIT_TRANSACTION_STATUSES.CANCELLED
        ])
        expect(refundNotification).not.toBeNull()
    })


    test("Admin resolves Demo Session without changing credits", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.UNDER_REVIEW,
            {
                sessionType: SESSION_TYPES.DEMO,
                credits: 0
            }
        )

        const response = await resolveSessionReview(
            session._id.toString(),
            {
                resolution: SESSION_STATUSES.COMPLETED
            },
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.COMPLETED
        )

        const updatedLearner = await User.findById(learner._id)
        const updatedTeacher = await User.findById(teacher._id)

        expect(updatedLearner.credits).toBe(0)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(updatedTeacher.credits).toBe(0)
        expect(
            await CreditTransaction.countDocuments({session: session._id})
        ).toBe(0)
    })


    test("Concurrent admin resolutions settle credits only once", async () => {
        const {user: admin} = await createTestAdmin()
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const accessToken = generateAccessToken(admin._id)

        const session = await createRegularReviewSession(
            teacher,
            learner,
            skill
        )

        const responses = await Promise.all([
            resolveSessionReview(
                session._id.toString(),
                {
                    resolution: SESSION_STATUSES.COMPLETED
                },
                accessToken
            ),
            resolveSessionReview(
                session._id.toString(),
                {
                    resolution: SESSION_STATUSES.COMPLETED
                },
                accessToken
            )
        ])

        expect(
            responses.map((response) => response.status).sort()
        ).toEqual([200, 409])

        const updatedLearner = await User.findById(learner._id)
        const updatedTeacher = await User.findById(teacher._id)

        expect(updatedLearner.credits).toBe(90)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(updatedTeacher.credits).toBe(10)
    })

})
