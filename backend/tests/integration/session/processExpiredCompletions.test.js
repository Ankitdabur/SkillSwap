import mongoose from "mongoose"
import { dbconnect } from "../../../src/db/index.js"
import Session from "../../../src/models/session.model.js"
import User from "../../../src/models/user.model.js"
import CreditTransaction from "../../../src/models/creditTransaction.model.js"
import Notification from "../../../src/models/notification.model.js"
import { processExpiredSessionCompletions } from "../../../src/node-cron.js"
import {
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_COMPLETION_RESPONSES,
    SESSION_STATUSES
} from "../../../src/constants/enums.js"
import {
    createTestCreditTransaction,
    createTestLearner,
    createTestSession,
    createTestSkill,
    createTestTeacher
} from "../../helpers/createTestUser.js"
import {
    cleanupTestCreditTransactions,
    cleanupTestNotifications,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const EXPIRED_SCHEDULED_AT = new Date(
    Date.now() - 50 * 60 * 60 * 1000
)


const createExpiredSession = async (
    teacher,
    learner,
    skill,
    responseData = {}
) => {
    const session = await createTestSession(
        teacher._id,
        learner._id,
        skill._id,
        SESSION_STATUSES.COMPLETION_PENDING
    )

    await Session.collection.updateOne(
        {
            _id: session._id
        },
        {
            $set: {
                scheduledAt: EXPIRED_SCHEDULED_AT,
                ...responseData
            }
        }
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
    await mongoose.disconnect()
})


describe("Process Expired Session Completions", () => {

    test("Cron processes all six expired completion scenarios exactly once", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const respondedAt = new Date(
            Date.now() - 49 * 60 * 60 * 1000
        )

        await User.findByIdAndUpdate(learner._id, {
            credits: 40,
            reservedCredits: 60
        })

        const neitherRespondedSession = await createExpiredSession(
            teacher,
            learner,
            skill
        )

        const teacherConfirmedSession = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                teacherCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.CONFIRMED,
                teacherRespondedAt: respondedAt
            }
        )

        const teacherReportedSession = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                teacherCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.DID_NOT_HAPPEN,
                teacherRespondedAt: respondedAt
            }
        )

        const learnerConfirmedSession = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                learnerCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.CONFIRMED,
                learnerRespondedAt: respondedAt
            }
        )

        const learnerReportedSession = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                learnerCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.DID_NOT_HAPPEN,
                learnerRespondedAt: respondedAt
            }
        )

        const learnerDisputedSession = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                learnerCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.DISPUTE,
                learnerRespondedAt: respondedAt
            }
        )

        const result = await processExpiredSessionCompletions()

        expect(result).toEqual({
            processedSessions: 6,
            failedSessions: []
        })

        const sessions = await Session.find({
            _id: {
                $in: [
                    neitherRespondedSession._id,
                    teacherConfirmedSession._id,
                    teacherReportedSession._id,
                    learnerConfirmedSession._id,
                    learnerReportedSession._id,
                    learnerDisputedSession._id
                ]
            }
        })

        const getSession = (sessionId) => sessions.find(
            (session) => session._id.equals(sessionId)
        )

        expect(
            getSession(neitherRespondedSession._id).status
        ).toBe(SESSION_STATUSES.UNDER_REVIEW)
        expect(
            getSession(neitherRespondedSession._id).teacherRespondedAt
        ).toBeNull()
        expect(
            getSession(neitherRespondedSession._id).learnerRespondedAt
        ).toBeNull()

        expect(
            getSession(teacherConfirmedSession._id).status
        ).toBe(SESSION_STATUSES.COMPLETED)
        expect(
            getSession(teacherConfirmedSession._id).completionMethod
        ).toBe(COMPLETION_METHODS.LEARNER_TIMEOUT)

        expect(
            getSession(teacherReportedSession._id).status
        ).toBe(SESSION_STATUSES.CANCELLED)

        expect(
            getSession(learnerConfirmedSession._id).status
        ).toBe(SESSION_STATUSES.COMPLETED)
        expect(
            getSession(learnerConfirmedSession._id).completionMethod
        ).toBe(COMPLETION_METHODS.TEACHER_TIMEOUT)

        expect(
            getSession(learnerReportedSession._id).status
        ).toBe(SESSION_STATUSES.CANCELLED)

        expect(
            getSession(learnerDisputedSession._id).status
        ).toBe(SESSION_STATUSES.UNDER_REVIEW)

        const updatedLearner = await User.findById(learner._id)
        const updatedTeacher = await User.findById(teacher._id)

        expect(updatedLearner.credits).toBe(60)
        expect(updatedLearner.reservedCredits).toBe(20)
        expect(updatedTeacher.credits).toBe(20)

        for(const session of [
            teacherConfirmedSession,
            learnerConfirmedSession
        ]){
            const transactions = await CreditTransaction.find({
                session: session._id
            })

            expect(
                transactions.map((transaction) => transaction.status)
            ).toEqual([
                CREDIT_TRANSACTION_STATUSES.COMPLETED,
                CREDIT_TRANSACTION_STATUSES.COMPLETED
            ])
        }

        for(const session of [
            teacherReportedSession,
            learnerReportedSession
        ]){
            const transactions = await CreditTransaction.find({
                session: session._id
            })

            expect(
                transactions.map((transaction) => transaction.status)
            ).toEqual([
                CREDIT_TRANSACTION_STATUSES.CANCELLED,
                CREDIT_TRANSACTION_STATUSES.CANCELLED
            ])
        }

        for(const session of [
            neitherRespondedSession,
            learnerDisputedSession
        ]){
            const transactions = await CreditTransaction.find({
                session: session._id
            })

            expect(
                transactions.map((transaction) => transaction.status)
            ).toEqual([
                CREDIT_TRANSACTION_STATUSES.PENDING,
                CREDIT_TRANSACTION_STATUSES.PENDING
            ])
        }

        expect(
            await Notification.countDocuments({
                type: NOTIFICATION_TYPES.SESSION_COMPLETED
            })
        ).toBe(4)
        expect(
            await Notification.countDocuments({
                type: NOTIFICATION_TYPES.SESSION_CANCELLED
            })
        ).toBe(4)
        expect(
            await Notification.countDocuments({
                type: NOTIFICATION_TYPES.SESSION_UNDER_REVIEW
            })
        ).toBe(4)

        const notificationCount = await Notification.countDocuments()

        const secondResult = await processExpiredSessionCompletions()

        expect(secondResult).toEqual({
            processedSessions: 0,
            failedSessions: []
        })
        expect(await Notification.countDocuments()).toBe(notificationCount)

        const learnerAfterRetry = await User.findById(learner._id)
        const teacherAfterRetry = await User.findById(teacher._id)

        expect(learnerAfterRetry.credits).toBe(60)
        expect(learnerAfterRetry.reservedCredits).toBe(20)
        expect(teacherAfterRetry.credits).toBe(20)
    })


    test("Cron rolls back completion when reservation is unavailable", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)

        const session = await createExpiredSession(
            teacher,
            learner,
            skill,
            {
                teacherCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.CONFIRMED,
                teacherRespondedAt: new Date()
            }
        )

        const result = await processExpiredSessionCompletions()

        expect(result.processedSessions).toBe(0)
        expect(result.failedSessions).toHaveLength(1)
        expect(result.failedSessions[0].sessionId).toBe(
            session._id.toString()
        )

        const savedSession = await Session.findById(session._id)
        const transactions = await CreditTransaction.find({
            session: session._id
        })

        expect(savedSession.status).toBe(
            SESSION_STATUSES.COMPLETION_PENDING
        )
        expect(
            transactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.PENDING,
            CREDIT_TRANSACTION_STATUSES.PENDING
        ])
    })

})
