import mongoose from "mongoose"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import CreditTransaction from "../../models/creditTransaction.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES,
    NOTIFICATION_TYPES,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"


const getUnderReviewSessionsService = async (cursor, limit) => {

    let cursorSession = null

    if(cursor){
        cursorSession = await Session.findOne({
            _id: cursor,
            status: SESSION_STATUSES.UNDER_REVIEW
        }).select("updatedAt")

        if(!cursorSession){
            throw new ApiError(
                400,
                "Invalid under-review Session cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const sessionResults = await Session.aggregate([
        {
            $match: {
                status: SESSION_STATUSES.UNDER_REVIEW
            }
        },
        ...(cursorSession
            ? [
                {
                    $match: {
                        $or: [
                            {
                                updatedAt: {
                                    $lt: cursorSession.updatedAt
                                }
                            },
                            {
                                updatedAt: cursorSession.updatedAt,
                                _id: {
                                    $lt: cursorSession._id
                                }
                            }
                        ]
                    }
                }
            ]
            : []),
        {
            $sort: {
                updatedAt: -1,
                _id: -1
            }
        },
        {
            $limit: limit + 1
        },
        {
            $project: {
                scheduledAt: 1,
                duration: 1,
                sessionType: 1,
                credits: 1,
                teacherCompletionResponse: 1,
                teacherRespondedAt: 1,
                learnerCompletionResponse: 1,
                learnerRespondedAt: 1,
                updatedAt: 1
            }
        }
    ])

    const hasMore = sessionResults.length > limit

    const sessions = hasMore
        ? sessionResults.slice(0, limit)
        : sessionResults

    const nextCursor = hasMore
        ? sessions[sessions.length - 1]._id.toString()
        : null

    return {
        sessions,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


const getUnderReviewSessionByIdService = async (sessionId) => {

    const session = await Session.findOne({
        _id: sessionId,
        status: SESSION_STATUSES.UNDER_REVIEW
    })
    .populate("teacher", "_id username fullname avatar")
    .populate("learner", "_id username fullname avatar")
    .populate("skill", "_id name displayName")

    if(!session){
        throw new ApiError(
            404,
            "Under-review Session not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    return {session}
}


const resolveSessionReviewService = async (
    sessionId,
    sessionResolutionData
) => {

    const {
        resolution,
        adminResponse
    } = sessionResolutionData

    const databaseSession = await mongoose.startSession()

    let resolvedSession

    try{
        await databaseSession.withTransaction(async () => {

            const existingSession = await Session.findById(sessionId)
            .session(databaseSession)

            if(!existingSession){
                throw new ApiError(
                    404,
                    "Session not found",
                    ERROR_CODES.RESOURCE_NOT_FOUND
                )
            }

            if(existingSession.status !== SESSION_STATUSES.UNDER_REVIEW){
                throw new ApiError(
                    409,
                    "Only an under-review Session can be resolved",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const sessionCompleted = (
                resolution === SESSION_STATUSES.COMPLETED
            )

            resolvedSession = await Session.findOneAndUpdate(
                {
                    _id: existingSession._id,
                    status: SESSION_STATUSES.UNDER_REVIEW
                },
                {
                    status: resolution,
                    adminResponse,
                    completionMethod: sessionCompleted
                        ? COMPLETION_METHODS.ADMIN
                        : null
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(!resolvedSession){
                throw new ApiError(
                    409,
                    "Session review was already resolved",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            if(existingSession.sessionType === SESSION_TYPES.REGULAR){
                const updatedLearner = await User.findOneAndUpdate(
                    {
                        _id: existingSession.learner,
                        reservedCredits: {
                            $gte: existingSession.credits
                        }
                    },
                    sessionCompleted
                        ? {
                            $inc: {
                                reservedCredits: -existingSession.credits
                            }
                        }
                        : {
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

                if(sessionCompleted){
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
                            status: sessionCompleted
                                ? CREDIT_TRANSACTION_STATUSES.COMPLETED
                                : CREDIT_TRANSACTION_STATUSES.CANCELLED
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

                if(sessionCompleted){
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
                }else{
                    await createNotificationService(
                        {
                            recipient: existingSession.learner,
                            type: NOTIFICATION_TYPES.SESSION_CREDITS_REFUNDED,
                            message: `+${existingSession.credits} credits were returned because the Session was cancelled`
                        },
                        databaseSession
                    )
                }
            }

            const notificationType = sessionCompleted
                ? NOTIFICATION_TYPES.SESSION_COMPLETED
                : NOTIFICATION_TYPES.SESSION_CANCELLED
            const notificationMessage = sessionCompleted
                ? "Admin completed your Session after review"
                : "Admin cancelled your Session after review"

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
        })
    }finally{
        await databaseSession.endSession()
    }

    return {session: resolvedSession}
}


export {
    getUnderReviewSessionsService,
    getUnderReviewSessionByIdService,
    resolveSessionReviewService
}
