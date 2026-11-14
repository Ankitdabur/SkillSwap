import mongoose from "mongoose"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import Report from "../../models/report.model.js"
import CreditTransaction from "../../models/creditTransaction.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    ACCOUNT_STATUSES,
    COMPLETION_METHODS,
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES,
    NOTIFICATION_TYPES,
    REPORT_STATUSES,
    SESSION_STATUSES,
    SESSION_TYPES,
    USER_ROLES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"
import { formatSuspensionExpiry } from "../users/accountStatus.service.js"


const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000


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


const suspendUserService = async (userId, suspensionData) => {

    const suspendedUntil = new Date(
        Date.now() + suspensionData.days * DAY_IN_MILLISECONDS
    )

    if(Number.isNaN(suspendedUntil.getTime())){
        throw new ApiError(
            400,
            "Suspension duration is too large",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    const databaseSession = await mongoose.startSession()

    let suspendedUser

    try{
        await databaseSession.withTransaction(async () => {

            const existingUser = await User.findById(userId)
            .select("role accountStatus")
            .session(databaseSession)

            if(!existingUser){
                throw new ApiError(
                    404,
                    "User not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            if(existingUser.role === USER_ROLES.ADMIN){
                throw new ApiError(
                    403,
                    "Admin account cannot be suspended",
                    ERROR_CODES.FORBIDDEN
                )
            }

            if(existingUser.accountStatus !== ACCOUNT_STATUSES.ACTIVE){
                throw new ApiError(
                    409,
                    "Only an active account can be suspended",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            suspendedUser = await User.findOneAndUpdate(
                {
                    _id: existingUser._id,
                    role: {
                        $ne: USER_ROLES.ADMIN
                    },
                    accountStatus: ACCOUNT_STATUSES.ACTIVE
                },
                {
                    $set: {
                        accountStatus: ACCOUNT_STATUSES.SUSPENDED,
                        suspendedUntil
                    },
                    $unset: {
                        refreshTokenHash: 1
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            ).select(
                "_id username fullname accountStatus suspendedUntil"
            )

            if(!suspendedUser){
                throw new ApiError(
                    409,
                    "User account status was already changed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            await createNotificationService(
                {
                    recipient: suspendedUser._id,
                    type: NOTIFICATION_TYPES.ACCOUNT_SUSPENDED,
                    message: `Your account is suspended until ${formatSuspensionExpiry(suspendedUser.suspendedUntil)}`
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    return {user: suspendedUser}
}


const banUserService = async (userId) => {

    const databaseSession = await mongoose.startSession()

    let bannedUser

    try{
        await databaseSession.withTransaction(async () => {

            const existingUser = await User.findById(userId)
            .select("role accountStatus")
            .session(databaseSession)

            if(!existingUser){
                throw new ApiError(
                    404,
                    "User not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            if(existingUser.role === USER_ROLES.ADMIN){
                throw new ApiError(
                    403,
                    "Admin account cannot be banned",
                    ERROR_CODES.FORBIDDEN
                )
            }

            if(existingUser.accountStatus === ACCOUNT_STATUSES.BANNED){
                throw new ApiError(
                    409,
                    "User account is already banned",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            bannedUser = await User.findOneAndUpdate(
                {
                    _id: existingUser._id,
                    role: {
                        $ne: USER_ROLES.ADMIN
                    },
                    accountStatus: {
                        $in: [
                            ACCOUNT_STATUSES.ACTIVE,
                            ACCOUNT_STATUSES.SUSPENDED
                        ]
                    }
                },
                {
                    $set: {
                        accountStatus: ACCOUNT_STATUSES.BANNED,
                        suspendedUntil: null
                    },
                    $unset: {
                        refreshTokenHash: 1
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            ).select(
                "_id username fullname accountStatus suspendedUntil"
            )

            if(!bannedUser){
                throw new ApiError(
                    409,
                    "User account status was already changed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            await createNotificationService(
                {
                    recipient: bannedUser._id,
                    type: NOTIFICATION_TYPES.ACCOUNT_BANNED,
                    message: "Your account has been permanently banned"
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    return {user: bannedUser}
}


const reactivateUserService = async (userId) => {

    const databaseSession = await mongoose.startSession()

    let reactivatedUser

    try{
        await databaseSession.withTransaction(async () => {

            const existingUser = await User.findById(userId)
            .select("role accountStatus")
            .session(databaseSession)

            if(!existingUser){
                throw new ApiError(
                    404,
                    "User not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            if(existingUser.role === USER_ROLES.ADMIN){
                throw new ApiError(
                    403,
                    "Admin account cannot be reactivated",
                    ERROR_CODES.FORBIDDEN
                )
            }

            if(existingUser.accountStatus !== ACCOUNT_STATUSES.SUSPENDED){
                throw new ApiError(
                    409,
                    "Only a suspended account can be reactivated",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            reactivatedUser = await User.findOneAndUpdate(
                {
                    _id: existingUser._id,
                    role: {
                        $ne: USER_ROLES.ADMIN
                    },
                    accountStatus: ACCOUNT_STATUSES.SUSPENDED
                },
                {
                    accountStatus: ACCOUNT_STATUSES.ACTIVE,
                    suspendedUntil: null
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            ).select(
                "_id username fullname accountStatus suspendedUntil"
            )

            if(!reactivatedUser){
                throw new ApiError(
                    409,
                    "User account status was already changed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            await createNotificationService(
                {
                    recipient: reactivatedUser._id,
                    type: NOTIFICATION_TYPES.ACCOUNT_REACTIVATED,
                    message: "Your account has been reactivated by the admin"
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    return {user: reactivatedUser}
}


const getReportsByStatusService = async (
    status,
    cursor,
    limit
) => {

    let cursorReport = null

    if(cursor){
        cursorReport = await Report.findOne({
            _id: cursor,
            status
        }).select("createdAt")

        if(!cursorReport){
            throw new ApiError(
                400,
                "Invalid Report cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const reportResults = await Report.aggregate([
        {
            $match: {
                status
            }
        },
        ...(cursorReport
            ? [
                {
                    $match: {
                        $or: [
                            {
                                createdAt: {
                                    $lt: cursorReport.createdAt
                                }
                            },
                            {
                                createdAt: cursorReport.createdAt,
                                _id: {
                                    $lt: cursorReport._id
                                }
                            }
                        ]
                    }
                }
            ]
            : []),
        {
            $sort: {
                createdAt: -1,
                _id: -1
            }
        },
        {
            $limit: limit + 1
        },
        {
            $lookup: {
                from: "users",
                localField: "reportedBy",
                foreignField: "_id",
                as: "reportedBy"
            }
        },
        {
            $unwind: "$reportedBy"
        },
        {
            $lookup: {
                from: "users",
                localField: "reportedUser",
                foreignField: "_id",
                as: "reportedUser"
            }
        },
        {
            $unwind: "$reportedUser"
        },
        {
            $project: {
                reason: 1,
                reportedBy: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                },
                reportedUser: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        }
    ])

    const hasMore = reportResults.length > limit

    const reports = hasMore
        ? reportResults.slice(0, limit)
        : reportResults

    const nextCursor = hasMore
        ? reports[reports.length - 1]._id.toString()
        : null

    return {
        reports,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


const getReportByIdService = async (reportId) => {

    const reportResults = await Report.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(reportId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reportedBy",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ],
                as: "reportedBy"
            }
        },
        {
            $unwind: "$reportedBy"
        },
        {
            $lookup: {
                from: "users",
                localField: "reportedUser",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            totalReports: 1
                        }
                    }
                ],
                as: "reportedUser"
            }
        },
        {
            $unwind: "$reportedUser"
        },
        {
            $lookup: {
                from: "sessions",
                localField: "session",
                foreignField: "_id",
                as: "session"
            }
        },
        {
            $unwind: {
                path: "$session",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "messages",
                localField: "message",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            content: 1,
                            imageUrl: 1,
                            isDeleted: 1,
                            sender: 1,
                            receiver: 1,
                            createdAt: 1
                        }
                    }
                ],
                as: "message"
            }
        },
        {
            $unwind: {
                path: "$message",
                preserveNullAndEmptyArrays: true
            }
        }
    ])

    const report = reportResults[0]

    if(!report){
        throw new ApiError(
            404,
            "Report not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    return {report}
}


const resolveReportService = async (
    reportId,
    reportDecisionData
) => {

    const existingReport = await Report.findById(reportId)
    .select("status")

    if(!existingReport){
        throw new ApiError(
            404,
            "Report not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    if(existingReport.status !== REPORT_STATUSES.PENDING){
        throw new ApiError(
            409,
            "Only a pending Report can be resolved",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    const resolvedReport = await Report.findOneAndUpdate(
        {
            _id: existingReport._id,
            status: REPORT_STATUSES.PENDING
        },
        {
            status: REPORT_STATUSES.RESOLVED,
            adminResponse: reportDecisionData.adminResponse
        },
        {
            new: true,
            runValidators: true
        }
    )

    if(!resolvedReport){
        throw new ApiError(
            409,
            "Report status was already changed",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    return {report: resolvedReport}
}


const dismissReportService = async (
    reportId,
    reportDecisionData
) => {

    const existingReport = await Report.findById(reportId)
    .select("status")

    if(!existingReport){
        throw new ApiError(
            404,
            "Report not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    if(existingReport.status !== REPORT_STATUSES.PENDING){
        throw new ApiError(
            409,
            "Only a pending Report can be dismissed",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    const dismissedReport = await Report.findOneAndUpdate(
        {
            _id: existingReport._id,
            status: REPORT_STATUSES.PENDING
        },
        {
            status: REPORT_STATUSES.DISMISSED,
            adminResponse: reportDecisionData.adminResponse
        },
        {
            new: true,
            runValidators: true
        }
    )

    if(!dismissedReport){
        throw new ApiError(
            409,
            "Report status was already changed",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    return {report: dismissedReport}
}

//create a endpoint in which admin give and a message and we will push a notification to the user 
export {
    getUnderReviewSessionsService,
    getUnderReviewSessionByIdService,
    resolveSessionReviewService,
    suspendUserService,
    banUserService,
    reactivateUserService,
    getReportsByStatusService,
    getReportByIdService,
    resolveReportService,
    dismissReportService
}
