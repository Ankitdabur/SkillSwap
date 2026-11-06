import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Session from "../../../src/models/session.model.js"
import User from "../../../src/models/user.model.js"
import Notification from "../../../src/models/notification.model.js"
import CreditTransaction from "../../../src/models/creditTransaction.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_COMPLETION_RESPONSES,
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
    cleanupTestCreditTransactions,
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
    await cleanupTestCreditTransactions()
    await cleanupTestSessions()
    await cleanupTestNotifications()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestCreditTransactions()
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

        await User.findByIdAndUpdate(learner._id, {
            credits: 100
        })

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

        const updatedLearner = await User.findById(learner._id)

        expect(updatedLearner.credits).toBe(90)
        expect(updatedLearner.reservedCredits).toBe(10)

        const creditTransactions = await CreditTransaction.find({
            session: session._id
        }).sort({amount: 1})

        expect(creditTransactions).toHaveLength(2)
        expect(creditTransactions[0].user).toEqual(learner._id)
        expect(creditTransactions[0].amount).toBe(-10)
        expect(creditTransactions[0].status).toBe(
            CREDIT_TRANSACTION_STATUSES.PENDING
        )
        expect(creditTransactions[1].user).toEqual(teacher._id)
        expect(creditTransactions[1].amount).toBe(10)
        expect(creditTransactions[1].status).toBe(
            CREDIT_TRANSACTION_STATUSES.PENDING
        )
    })


    test("Learner is notified when Session acceptance lacks credits", async () => {
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
                meetingLink: "https://meet.example.com/insufficient-credits"
            }
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INSUFFICIENT_CREDITS)

        const savedSession = await Session.findById(session._id)
        const updatedLearner = await User.findById(learner._id)
        const creditTransactions = await CreditTransaction.find({
            session: session._id
        })
        const notification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_INSUFFICIENT_CREDITS
        })

        expect(savedSession.status).toBe(SESSION_STATUSES.PENDING)
        expect(updatedLearner.credits).toBe(0)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(creditTransactions).toHaveLength(0)
        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${teacher.username} tried to accept your Session request, but you do not have enough credits`
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

        await User.findByIdAndUpdate(learner._id, {
            credits: 100
        })

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const acceptanceResponse = await patchSession(
            session._id.toString(),
            "accept",
            generateAccessToken(teacher._id),
            {
                meetingLink: "https://meet.example.com/cancelled-session"
            }
        )

        expect(acceptanceResponse.status).toBe(200)

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

        const updatedLearner = await User.findById(learner._id)
        const creditTransactions = await CreditTransaction.find({
            session: session._id
        })

        expect(updatedLearner.credits).toBe(100)
        expect(updatedLearner.reservedCredits).toBe(0)
        expect(creditTransactions).toHaveLength(2)
        expect(
            creditTransactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.CANCELLED,
            CREDIT_TRANSACTION_STATUSES.CANCELLED
        ])
    })


    test("Teacher and learner can confirm and complete a Session", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        await User.findByIdAndUpdate(learner._id, {
            credits: 100
        })

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id
        )

        const acceptanceResponse = await patchSession(
            session._id.toString(),
            "accept",
            generateAccessToken(teacher._id),
            {
                meetingLink: "https://meet.example.com/completed-session"
            }
        )

        expect(acceptanceResponse.status).toBe(200)

        await Session.collection.updateOne(
            {
                _id: session._id
            },
            {
                $set: {
                    scheduledAt: new Date(
                        Date.now() - 2 * 60 * 60 * 1000
                    )
                }
            }
        )

        const teacherResponse = await patchSession(
            session._id.toString(),
            "confirm-completion",
            generateAccessToken(teacher._id)
        )

        expect(teacherResponse.status).toBe(200)
        expect(teacherResponse.data.data.session.status).toBe(
            SESSION_STATUSES.COMPLETION_PENDING
        )
        expect(
            teacherResponse.data.data.session.teacherRespondedAt
        ).toContain("+05:30")
        expect(
            teacherResponse.data.data.session.learnerRespondedAt
        ).toBeNull()
        expect(
            teacherResponse.data.data.session.teacherCompletionResponse
        ).toBe(SESSION_COMPLETION_RESPONSES.CONFIRMED)
        expect(
            teacherResponse.data.data.session.learnerCompletionResponse
        ).toBeNull()

        const pendingLearner = await User.findById(learner._id)
        const pendingTransactions = await CreditTransaction.find({
            session: session._id
        })
        const confirmationNotification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_COMPLETION_CONFIRMED
        })

        expect(pendingLearner.credits).toBe(90)
        expect(pendingLearner.reservedCredits).toBe(10)
        expect(
            pendingTransactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.PENDING,
            CREDIT_TRANSACTION_STATUSES.PENDING
        ])
        expect(confirmationNotification.message).toBe(
            `${teacher.username} confirmed that the Session happened. Submit your response before the 48-hour deadline`
        )

        const learnerResponse = await patchSession(
            session._id.toString(),
            "confirm-completion",
            generateAccessToken(learner._id)
        )

        expect(learnerResponse.status).toBe(200)
        expect(learnerResponse.data.data.session.status).toBe(
            SESSION_STATUSES.COMPLETED
        )
        expect(learnerResponse.data.data.session.completionMethod).toBe(
            COMPLETION_METHODS.BOTH_CONFIRMED
        )
        expect(
            learnerResponse.data.data.session.teacherRespondedAt
        ).toContain("+05:30")
        expect(
            learnerResponse.data.data.session.learnerRespondedAt
        ).toContain("+05:30")
        expect(
            learnerResponse.data.data.session.teacherCompletionResponse
        ).toBe(SESSION_COMPLETION_RESPONSES.CONFIRMED)
        expect(
            learnerResponse.data.data.session.learnerCompletionResponse
        ).toBe(SESSION_COMPLETION_RESPONSES.CONFIRMED)

        const completedLearner = await User.findById(learner._id)
        const completedTeacher = await User.findById(teacher._id)
        const completedTransactions = await CreditTransaction.find({
            session: session._id
        })
        const completionNotification = await Notification.findOne({
            recipient: teacher._id,
            type: NOTIFICATION_TYPES.SESSION_COMPLETED
        })
        const debitNotification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_CREDITS_DEBITED
        })
        const creditNotification = await Notification.findOne({
            recipient: teacher._id,
            type: NOTIFICATION_TYPES.SESSION_CREDITS_CREDITED
        })

        expect(completedLearner.credits).toBe(90)
        expect(completedLearner.reservedCredits).toBe(0)
        expect(completedTeacher.credits).toBe(10)
        expect(
            completedTransactions.map((transaction) => transaction.status)
        ).toEqual([
            CREDIT_TRANSACTION_STATUSES.COMPLETED,
            CREDIT_TRANSACTION_STATUSES.COMPLETED
        ])
        expect(completionNotification.message).toBe(
            `${learner.username} confirmed that the Session happened. Your Session is now completed`
        )
        expect(debitNotification.message).toBe(
            "-10 credits were debited for your completed Session"
        )
        expect(creditNotification.message).toBe(
            "+10 credits were credited for your completed Session"
        )
    })


    test("Conflicting completion responses move Session under review", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        await Session.collection.updateOne(
            {
                _id: session._id
            },
            {
                $set: {
                    scheduledAt: new Date(
                        Date.now() - 2 * 60 * 60 * 1000
                    ),
                    learnerCompletionResponse:
                        SESSION_COMPLETION_RESPONSES.DID_NOT_HAPPEN,
                    learnerRespondedAt: new Date()
                }
            }
        )

        const response = await patchSession(
            session._id.toString(),
            "confirm-completion",
            generateAccessToken(teacher._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.session.status).toBe(
            SESSION_STATUSES.UNDER_REVIEW
        )

        const notification = await Notification.findOne({
            recipient: learner._id,
            type: NOTIFICATION_TYPES.SESSION_UNDER_REVIEW
        })

        expect(notification.message).toBe(
            `${teacher.username} confirmed that the Session happened, but your responses do not match. The Session is now under review`
        )
    })


    test("Session completion cannot be confirmed before it ends", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        const response = await patchSession(
            session._id.toString(),
            "confirm-completion",
            generateAccessToken(teacher._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.message).toBe(
            "Session completion cannot be confirmed before it ends"
        )
    })


    test("Session completion cannot be confirmed after 48 hours", async () => {
        const {skill, learner, teacher} = await createSessionUsers()

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.ACCEPTED
        )

        await Session.collection.updateOne(
            {
                _id: session._id
            },
            {
                $set: {
                    scheduledAt: new Date(
                        Date.now() - 50 * 60 * 60 * 1000
                    )
                }
            }
        )

        const response = await patchSession(
            session._id.toString(),
            "confirm-completion",
            generateAccessToken(teacher._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.message).toBe(
            "The Session completion confirmation window has expired"
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
