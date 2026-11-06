import mongoose from "mongoose"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import CreditTransaction from "../../models/creditTransaction.model.js"
import {
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES,
    NOTIFICATION_TYPES,
    SESSION_COMPLETION_RESPONSES,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../constants/enums.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { createNotificationService } from "../notifications/notification.service.js"


const COMPLETION_WINDOW_MS = 48 * 60 * 60 * 1000


const processExpiredSessionCompletionsService = async () => {

    const processingTime = new Date()

    const expiredSessions = await Session.find({
        status: {
            $in: [
                SESSION_STATUSES.ACCEPTED,
                SESSION_STATUSES.COMPLETION_PENDING
            ]
        },
        $or: [
            {
                teacherCompletionResponse: null
            },
            {
                learnerCompletionResponse: null
            }
        ],
        $expr: {
            $lte: [
                {
                    $add: [
                        "$scheduledAt",
                        {
                            $multiply: ["$duration", 60 * 1000]
                        },
                        COMPLETION_WINDOW_MS
                    ]
                },
                processingTime
            ]
        }
    }).select("_id")

    let processedSessions = 0
    const failedSessions = []

    for(const expiredSession of expiredSessions){
        const databaseSession = await mongoose.startSession()

        let sessionProcessed = false

        try{
            await databaseSession.withTransaction(async () => {

                sessionProcessed = false

                const existingSession = await Session.findById(
                    expiredSession._id
                ).session(databaseSession)

                if(!existingSession){
                    return
                }

                if(![
                    SESSION_STATUSES.ACCEPTED,
                    SESSION_STATUSES.COMPLETION_PENDING
                ].includes(existingSession.status)){
                    return
                }

                const completionDeadline = new Date(
                    existingSession.scheduledAt.getTime() +
                    existingSession.duration * 60 * 1000 +
                    COMPLETION_WINDOW_MS
                )

                if(completionDeadline > processingTime){
                    return
                }

                const teacherResponse =
                    existingSession.teacherCompletionResponse
                const learnerResponse =
                    existingSession.learnerCompletionResponse

                if(teacherResponse !== null && learnerResponse !== null){
                    return
                }

                const submittedResponse = teacherResponse ?? learnerResponse
                const sessionCompleted = submittedResponse ===
                    SESSION_COMPLETION_RESPONSES.CONFIRMED
                const sessionCancelled = submittedResponse ===
                    SESSION_COMPLETION_RESPONSES.DID_NOT_HAPPEN
                const updatedStatus = sessionCompleted
                    ? SESSION_STATUSES.COMPLETED
                    : sessionCancelled
                        ? SESSION_STATUSES.CANCELLED
                        : SESSION_STATUSES.UNDER_REVIEW
                const completionMethod = sessionCompleted
                    ? teacherResponse === null
                        ? COMPLETION_METHODS.TEACHER_TIMEOUT
                        : COMPLETION_METHODS.LEARNER_TIMEOUT
                    : null

                const updatedSession = await Session.findOneAndUpdate(
                    {
                        _id: existingSession._id,
                        status: existingSession.status,
                        teacherCompletionResponse: teacherResponse,
                        learnerCompletionResponse: learnerResponse
                    },
                    {
                        status: updatedStatus,
                        completionMethod
                    },
                    {
                        new: true,
                        runValidators: true,
                        session: databaseSession
                    }
                )

                if(!updatedSession){
                    return
                }

                if(
                    sessionCompleted &&
                    existingSession.sessionType === SESSION_TYPES.REGULAR
                ){
                    const updatedLearner = await User.findOneAndUpdate(
                        {
                            _id: existingSession.learner,
                            reservedCredits: {
                                $gte: existingSession.credits
                            }
                        },
                        {
                            $inc: {
                                reservedCredits: -existingSession.credits
                            }
                        },
                        {
                            new: true,
                            runValidators: true,
                            session: databaseSession
                        }
                    )

                    if(!updatedLearner){
                        throw new ApiError(
                            409,
                            "Session credit reservation is unavailable",
                            ERROR_CODES.INVALID_REQUEST
                        )
                    }

                    const updatedTeacher = await User.findByIdAndUpdate(
                        existingSession.teacher,
                        {
                            $inc: {
                                credits: existingSession.credits
                            }
                        },
                        {
                            new: true,
                            runValidators: true,
                            session: databaseSession
                        }
                    )

                    if(!updatedTeacher){
                        throw new ApiError(
                            404,
                            "Teacher not found",
                            ERROR_CODES.USER_NOT_FOUND
                        )
                    }

                    const transactionUpdateResult =
                        await CreditTransaction.updateMany(
                            {
                                session: existingSession._id,
                                user: {
                                    $in: [
                                        existingSession.teacher,
                                        existingSession.learner
                                    ]
                                },
                                type: CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT,
                                status: CREDIT_TRANSACTION_STATUSES.PENDING
                            },
                            {
                                status: CREDIT_TRANSACTION_STATUSES.COMPLETED
                            },
                            {
                                runValidators: true,
                                session: databaseSession
                            }
                        )

                    if(transactionUpdateResult.matchedCount !== 2){
                        throw new ApiError(
                            409,
                            "Session credit transactions are unavailable",
                            ERROR_CODES.INVALID_REQUEST
                        )
                    }

                    await createNotificationService(
                        {
                            recipient: existingSession.learner,
                            type: NOTIFICATION_TYPES.SESSION_CREDITS_DEBITED,
                            message: `-${existingSession.credits} credits were debited for your completed Session`
                        },
                        databaseSession
                    )

                    await createNotificationService(
                        {
                            recipient: existingSession.teacher,
                            type: NOTIFICATION_TYPES.SESSION_CREDITS_CREDITED,
                            message: `+${existingSession.credits} credits were credited for your completed Session`
                        },
                        databaseSession
                    )
                }

                if(
                    sessionCancelled &&
                    existingSession.sessionType === SESSION_TYPES.REGULAR
                ){
                    const updatedLearner = await User.findOneAndUpdate(
                        {
                            _id: existingSession.learner,
                            reservedCredits: {
                                $gte: existingSession.credits
                            }
                        },
                        {
                            $inc: {
                                credits: existingSession.credits,
                                reservedCredits: -existingSession.credits
                            }
                        },
                        {
                            new: true,
                            runValidators: true,
                            session: databaseSession
                        }
                    )

                    if(!updatedLearner){
                        throw new ApiError(
                            409,
                            "Session credit reservation is unavailable",
                            ERROR_CODES.INVALID_REQUEST
                        )
                    }

                    const transactionUpdateResult =
                        await CreditTransaction.updateMany(
                            {
                                session: existingSession._id,
                                user: {
                                    $in: [
                                        existingSession.teacher,
                                        existingSession.learner
                                    ]
                                },
                                type: CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT,
                                status: CREDIT_TRANSACTION_STATUSES.PENDING
                            },
                            {
                                status: CREDIT_TRANSACTION_STATUSES.CANCELLED
                            },
                            {
                                runValidators: true,
                                session: databaseSession
                            }
                        )

                    if(transactionUpdateResult.matchedCount !== 2){
                        throw new ApiError(
                            409,
                            "Session credit transactions are unavailable",
                            ERROR_CODES.INVALID_REQUEST
                        )
                    }

                    await createNotificationService(
                        {
                            recipient: existingSession.learner,
                            type: NOTIFICATION_TYPES.SESSION_CREDITS_REFUNDED,
                            message: `+${existingSession.credits} credits were returned because the Session was cancelled`
                        },
                        databaseSession
                    )
                }

                const notificationType = sessionCompleted
                    ? NOTIFICATION_TYPES.SESSION_COMPLETED
                    : sessionCancelled
                        ? NOTIFICATION_TYPES.SESSION_CANCELLED
                        : NOTIFICATION_TYPES.SESSION_UNDER_REVIEW
                const notificationMessage = sessionCompleted
                    ? "Your Session was completed after the 48-hour response window expired"
                    : sessionCancelled
                        ? "Your Session was cancelled after the 48-hour response window expired"
                        : "Your Session moved under review after the 48-hour response window expired"

                for(const recipient of [
                    existingSession.teacher,
                    existingSession.learner
                ]){
                    await createNotificationService(
                        {
                            recipient,
                            type: notificationType,
                            message: notificationMessage
                        },
                        databaseSession
                    )
                }

                sessionProcessed = true
            })

            if(sessionProcessed){
                processedSessions += 1
            }
        }catch(error){
            failedSessions.push({
                sessionId: expiredSession._id.toString(),
                message: error.message
            })
        }finally{
            await databaseSession.endSession()
        }
    }

    return {
        processedSessions,
        failedSessions
    }
}


export {processExpiredSessionCompletionsService}
