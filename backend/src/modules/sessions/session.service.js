import mongoose from "mongoose"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import Skill from "../../models/skill.model.js"
import Match from "../../models/match.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    ACCOUNT_TYPES,
    MATCH_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_STATUSES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"


const IST_OFFSET_MINUTES = 330

const formatDateToIST = (date) => {
    const istDate = new Date(
        date.getTime() + IST_OFFSET_MINUTES * 60 * 1000
    )

    return istDate.toISOString().replace("Z", "+05:30")
}


const createSessionService = async (loggedInUser, sessionRequestData) => {

    const {
        teacherId,
        skillId,
        scheduledAt,
        duration,
        sessionType,
        credits
    } = sessionRequestData

    const databaseSession = await mongoose.startSession()

    let createdSession

    try{
        await databaseSession.withTransaction(async () => {

            const learner = await User.findById(loggedInUser)
            .select("username accountType")
            .session(databaseSession)


            const teacher = await User.findById(teacherId)
            .select("username accountType teachingSkills")
            .session(databaseSession)

            if(!teacher){
                throw new ApiError(
                    404,
                    "Teacher not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }


            if(![
                ACCOUNT_TYPES.TEACHER,
                ACCOUNT_TYPES.TEACHER_LEARNER
            ].includes(teacher.accountType)){
                throw new ApiError(
                    403,
                    "Selected user is not permitted to teach",
                    ERROR_CODES.ACCOUNT_TYPE_NOT_PERMITTED
                )
            }

            const skillExists = await Skill.exists({
                _id: skillId
            }).session(databaseSession)

            if(!skillExists){
                throw new ApiError(
                    404,
                    "Skill not found",
                    ERROR_CODES.RESOURCE_NOT_FOUND
                )
            }

            const teacherOffersSkill = teacher.teachingSkills.some(
                (teachingSkill) => teachingSkill.equals(skillId)
            )

            if(!teacherOffersSkill){
                throw new ApiError(
                    400,
                    "Teacher does not offer the selected Skill",
                    ERROR_CODES.INVALID_FIELD_VALUE
                )
            }

            const pairKey = [
                learner._id.toString(),
                teacher._id.toString()
            ]
                .sort()
                .join(":")

            const acceptedMatchExists = await Match.exists({
                pairKey,
                status: MATCH_STATUSES.ACCEPTED
            }).session(databaseSession)

            if(!acceptedMatchExists){
                throw new ApiError(
                    403,
                    "An accepted Match is required to request a Session",
                    ERROR_CODES.FORBIDDEN
                )
            }

            const requestedEnd = new Date(
                scheduledAt.getTime() + duration * 60 * 1000
            )

            const learnerHasAcceptedConflict = await Session.exists({
                status: SESSION_STATUSES.ACCEPTED,
                scheduledAt: {
                    $lt: requestedEnd
                },
                $expr: {
                    $gt: [
                        {
                            $add: [
                                "$scheduledAt",
                                {
                                    $multiply: ["$duration", 60 * 1000]
                                }
                            ]
                        },
                        scheduledAt
                    ]
                },
                $or: [
                    {
                        teacher: learner._id
                    },
                    {
                        learner: learner._id
                    }
                ]
            }).session(databaseSession)

            if(learnerHasAcceptedConflict){
                throw new ApiError(
                    409,
                    "You already have an accepted Session at this time",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const sessions = await Session.create(
                [
                    {
                        teacher: teacher._id,
                        learner: learner._id,
                        skill: skillId,
                        scheduledAt,
                        duration,
                        sessionType,
                        credits
                    }
                ],
                {
                    session: databaseSession
                }
            )

            createdSession = sessions[0]

            await createNotificationService(
                {
                    recipient: teacher._id,
                    type: NOTIFICATION_TYPES.SESSION_REQUEST_RECEIVED,
                    message: `${learner.username} sent you a Session request`
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    const session = createdSession.toObject()
    session.scheduledAt = formatDateToIST(createdSession.scheduledAt)

    return {session}
}


const getSessionsByParticipantService = async (
    loggedInUser,
    participantField,
    sessionListQuery
) => {

    const {
        status,
        cursor,
        limit
    } = sessionListQuery

    const participantId = new mongoose.Types.ObjectId(
        loggedInUser.toString()
    )

    let cursorSession = null

    if(cursor){
        const cursorSessions = await Session.find({
            _id: cursor,
            [participantField]: participantId,
            status
        })
        .select("scheduledAt")


        cursorSession = cursorSessions[0]

        if(!cursorSession){
            throw new ApiError(
                400,
                "Invalid Session cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const sessionResults = await Session.aggregate([
        {
            $match: {
                [participantField]: participantId,
                status
            }
        },
        ...(cursorSession
            ? [
                {
                    $match: {
                        $or: [
                            {
                                scheduledAt: {
                                    $lt: cursorSession.scheduledAt
                                }
                            },
                            {
                                scheduledAt: cursorSession.scheduledAt,
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
                scheduledAt: -1,
                _id: -1
            }
        },
        {
            $limit: limit + 1
        },
        {
            $set: {
                scheduledAt: {
                    $dateToString: {
                        date: "$scheduledAt",
                        format: "%Y-%m-%dT%H:%M:%S.%L+05:30",
                        timezone: "Asia/Kolkata"
                    }
                }
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


const getTeachingSessionsService = async (
    loggedInUser,
    sessionListQuery
) => {

    return getSessionsByParticipantService(
        loggedInUser,
        "teacher",
        sessionListQuery
    )
}


const getLearningSessionsService = async (
    loggedInUser,
    sessionListQuery
) => {

    return getSessionsByParticipantService(
        loggedInUser,
        "learner",
        sessionListQuery
    )
}


const getSessionByIdService = async (loggedInUser, sessionId) => {

    const sessionDocument = await Session.findById(sessionId)

    if(!sessionDocument){
        throw new ApiError(
            404,
            "Session not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    if(
        !sessionDocument.teacher.equals(loggedInUser) &&
        !sessionDocument.learner.equals(loggedInUser)
    ){
        throw new ApiError(
            403,
            "Only Session participants can view this Session",
            ERROR_CODES.FORBIDDEN
        )
    }

    const session = sessionDocument.toObject()
    session.scheduledAt = formatDateToIST(sessionDocument.scheduledAt)

    return {session}
}


const acceptSessionService = async (
    loggedInUser,
    sessionId,
    sessionAcceptanceData
) => {

    const {
        meetingLink,
        teacherResponse
    } = sessionAcceptanceData

    const databaseSession = await mongoose.startSession()

    let acceptedSession

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

            if(!existingSession.teacher.equals(loggedInUser)){
                throw new ApiError(
                    403,
                    "Only the assigned teacher can accept this Session",
                    ERROR_CODES.FORBIDDEN
                )
            }

            if(existingSession.status !== SESSION_STATUSES.PENDING){
                throw new ApiError(
                    409,
                    "Session request is no longer pending",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            if(existingSession.scheduledAt <= new Date()){
                throw new ApiError(
                    409,
                    "A past Session request cannot be accepted",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const requestedEnd = new Date(
                existingSession.scheduledAt.getTime() +
                existingSession.duration * 60 * 1000
            )

            const participantIds = [
                existingSession.teacher,
                existingSession.learner
            ]

            const conflictingAcceptedSessions = await Session.find({
                _id: {
                    $ne: existingSession._id
                },
                status: SESSION_STATUSES.ACCEPTED,
                scheduledAt: {
                    $lt: requestedEnd
                },
                $expr: {
                    $gt: [
                        {
                            $add: [
                                "$scheduledAt",
                                {
                                    $multiply: ["$duration", 60 * 1000]
                                }
                            ]
                        },
                        existingSession.scheduledAt
                    ]
                },
                $or: [
                    {
                        teacher: {
                            $in: participantIds
                        }
                    },
                    {
                        learner: {
                            $in: participantIds
                        }
                    }
                ]
            })
            .select("teacher learner")
            .session(databaseSession)

            const teacherBusy = conflictingAcceptedSessions.some(
                (conflictingSession) =>
                    conflictingSession.teacher.equals(existingSession.teacher) ||
                    conflictingSession.learner.equals(existingSession.teacher)
            )

            const learnerBusy = conflictingAcceptedSessions.some(
                (conflictingSession) =>
                    conflictingSession.teacher.equals(existingSession.learner) ||
                    conflictingSession.learner.equals(existingSession.learner)
            )

            if(teacherBusy && learnerBusy){
                throw new ApiError(
                    409,
                    "Teacher and learner already have accepted Sessions at this time",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            if(teacherBusy){
                throw new ApiError(
                    409,
                    "Teacher already has an accepted Session at this time",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            if(learnerBusy){
                throw new ApiError(
                    409,
                    "Learner already has an accepted Session at this time",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            acceptedSession = await Session.findOneAndUpdate(
                {
                    _id: sessionId,
                    teacher: loggedInUser,
                    status: SESSION_STATUSES.PENDING
                },
                {
                    status: SESSION_STATUSES.ACCEPTED,
                    meetingLink,
                    teacherResponse
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(!acceptedSession){
                throw new ApiError(
                    409,
                    "Session request is no longer pending",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const teacher = await User.findById(loggedInUser)
            .select("username")
            .session(databaseSession)

            await createNotificationService(
                {
                    recipient: acceptedSession.learner,
                    type: NOTIFICATION_TYPES.SESSION_REQUEST_ACCEPTED,
                    message: `${teacher.username} accepted your Session request`
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    const session = acceptedSession.toObject()
    session.scheduledAt = formatDateToIST(acceptedSession.scheduledAt)

    return {session}
}


const rejectConflictingSessionsService = async (
    loggedInUser,
    sessionId
) => {

    const databaseSession = await mongoose.startSession()

    let rejectedCount = 0
    let deletedCount = 0

    try{
        await databaseSession.withTransaction(async () => {

            const acceptedSession = await Session.findById(sessionId)
            .session(databaseSession)

            if(!acceptedSession){
                throw new ApiError(
                    404,
                    "Session not found",
                    ERROR_CODES.RESOURCE_NOT_FOUND
                )
            }

            if(
                !acceptedSession.teacher.equals(loggedInUser) &&
                !acceptedSession.learner.equals(loggedInUser)
            ){
                throw new ApiError(
                    403,
                    "Only Session participants can handle conflicting Sessions",
                    ERROR_CODES.FORBIDDEN
                )
            }

            if(acceptedSession.status !== SESSION_STATUSES.ACCEPTED){
                throw new ApiError(
                    409,
                    "Conflicts can be handled only for an accepted Session",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const acceptedSessionEnd = new Date(
                acceptedSession.scheduledAt.getTime() +
                acceptedSession.duration * 60 * 1000
            )

            const conflictingPendingFilter = {
                _id: {
                    $ne: acceptedSession._id
                },
                status: SESSION_STATUSES.PENDING,
                scheduledAt: {
                    $lt: acceptedSessionEnd
                },
                $expr: {
                    $gt: [
                        {
                            $add: [
                                "$scheduledAt",
                                {
                                    $multiply: ["$duration", 60 * 1000]
                                }
                            ]
                        },
                        acceptedSession.scheduledAt
                    ]
                }
            }

            const rejectionResult = await Session.updateMany(
                {
                    ...conflictingPendingFilter,
                    teacher: loggedInUser
                },
                {
                    status: SESSION_STATUSES.REJECTED
                },
                {
                    runValidators: true,
                    session: databaseSession
                }
            )

            const deletionResult = await Session.deleteMany(
                {
                    ...conflictingPendingFilter,
                    learner: loggedInUser
                },
                {
                    session: databaseSession
                }
            )

            rejectedCount = rejectionResult.modifiedCount
            deletedCount = deletionResult.deletedCount
        })
    }finally{
        await databaseSession.endSession()
    }

    return {
        rejectedCount,
        deletedCount
    }
}


const rejectSessionService = async (
    loggedInUser,
    sessionId,
    sessionRejectionData
) => {

    const {teacherResponse} = sessionRejectionData

    const databaseSession = await mongoose.startSession()

    let rejectedSession

    try{
        await databaseSession.withTransaction(async () => {

            rejectedSession = await Session.findOneAndUpdate(
                {
                    _id: sessionId,
                    teacher: loggedInUser,
                    status: SESSION_STATUSES.PENDING
                },
                {
                    status: SESSION_STATUSES.REJECTED,
                    teacherResponse
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(!rejectedSession){
                const existingSession = await Session.findById(sessionId)
                .session(databaseSession)

                if(!existingSession){
                    throw new ApiError(
                        404,
                        "Session not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                if(!existingSession.teacher.equals(loggedInUser)){
                    throw new ApiError(
                        403,
                        "Only the assigned teacher can reject this Session",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                throw new ApiError(
                    409,
                    "Session request is no longer pending",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const teacher = await User.findById(loggedInUser)
            .select("username")
            .session(databaseSession)

            await createNotificationService(
                {
                    recipient: rejectedSession.learner,
                    type: NOTIFICATION_TYPES.SESSION_REQUEST_REJECTED,
                    message: `${teacher.username} rejected your Session request`
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    const session = rejectedSession.toObject()
    session.scheduledAt = formatDateToIST(rejectedSession.scheduledAt)

    return {session}
}


const cancelSessionService = async (loggedInUser, sessionId) => {

    const databaseSession = await mongoose.startSession()

    let cancelledSession

    try{
        await databaseSession.withTransaction(async () => {

            cancelledSession = await Session.findOneAndUpdate(
                {
                    _id: sessionId,
                    status: SESSION_STATUSES.ACCEPTED,
                    scheduledAt: {
                        $gt: new Date()
                    },
                    $or: [
                        {
                            teacher: loggedInUser
                        },
                        {
                            learner: loggedInUser
                        }
                    ]
                },
                {
                    status: SESSION_STATUSES.CANCELLED
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(!cancelledSession){
                const existingSession = await Session.findById(sessionId)
                .session(databaseSession)

                if(!existingSession){
                    throw new ApiError(
                        404,
                        "Session not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                if(
                    !existingSession.teacher.equals(loggedInUser) &&
                    !existingSession.learner.equals(loggedInUser)
                ){
                    throw new ApiError(
                        403,
                        "Only Session participants can cancel this Session",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                if(existingSession.status !== SESSION_STATUSES.ACCEPTED){
                    throw new ApiError(
                        409,
                        "Only an accepted Session can be cancelled",
                        ERROR_CODES.INVALID_REQUEST
                    )
                }

                throw new ApiError(
                    409,
                    "A Session cannot be cancelled after it starts",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const cancellingUser = await User.findById(loggedInUser)
            .select("username")
            .session(databaseSession)

            const recipient = cancelledSession.teacher.equals(loggedInUser)
                ? cancelledSession.learner
                : cancelledSession.teacher

            await createNotificationService(
                {
                    recipient,
                    type: NOTIFICATION_TYPES.SESSION_CANCELLED,
                    message: `${cancellingUser.username} cancelled your Session`
                },
                databaseSession
            )
        })
    }finally{
        await databaseSession.endSession()
    }

    const session = cancelledSession.toObject()
    session.scheduledAt = formatDateToIST(cancelledSession.scheduledAt)

    return {session}
}


const unsendSessionService = async (loggedInUser, sessionId) => {

    const unsentSession = await Session.findOneAndDelete({
        _id: sessionId,
        learner: loggedInUser,
        status: SESSION_STATUSES.PENDING
    })

    if(!unsentSession){
        const existingSession = await Session.findById(sessionId)

        if(!existingSession){
            throw new ApiError(
                404,
                "Session not found",
                ERROR_CODES.RESOURCE_NOT_FOUND
            )
        }

        if(!existingSession.learner.equals(loggedInUser)){
            throw new ApiError(
                403,
                "Only the learner who created this request can unsend it",
                ERROR_CODES.FORBIDDEN
            )
        }

        throw new ApiError(
            409,
            "Session request is no longer pending",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    const session = unsentSession.toObject()
    session.scheduledAt = formatDateToIST(unsentSession.scheduledAt)

    return {session}
}


const getConflictingSessionsService = async (
    loggedInUser,
    sessionId
) => {

    const selectedSession = await Session.findById(sessionId)

    if(!selectedSession){
        throw new ApiError(
            404,
            "Session not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    if(
        !selectedSession.teacher.equals(loggedInUser) &&
        !selectedSession.learner.equals(loggedInUser)
    ){
        throw new ApiError(
            403,
            "Only Session participants can view conflicting Sessions",
            ERROR_CODES.FORBIDDEN
        )
    }

    const selectedSessionEnd = new Date(
        selectedSession.scheduledAt.getTime() +
        selectedSession.duration * 60 * 1000
    )

    const conflictingSessionDocuments = await Session.find({
        _id: {
            $ne: selectedSession._id
        },
        status: {
            $in: [
                SESSION_STATUSES.PENDING,
                SESSION_STATUSES.ACCEPTED
            ]
        },
        scheduledAt: {
            $lt: selectedSessionEnd
        },
        $expr: {
            $gt: [
                {
                    $add: [
                        "$scheduledAt",
                        {
                            $multiply: ["$duration", 60 * 1000]
                        }
                    ]
                },
                selectedSession.scheduledAt
            ]
        },
        $or: [
            {
                teacher: loggedInUser
            },
            {
                learner: loggedInUser
            }
        ]
    }).sort({
        scheduledAt: 1,
        _id: 1
    })

    const conflictingSessions = conflictingSessionDocuments.map(
        (sessionDocument) => {
            const session = sessionDocument.toObject()
            session.scheduledAt = formatDateToIST(
                sessionDocument.scheduledAt
            )

            return session
        }
    )

    return {conflictingSessions}
}


export {
    createSessionService,
    getTeachingSessionsService,
    getLearningSessionsService,
    getSessionByIdService,
    acceptSessionService,
    rejectConflictingSessionsService,
    rejectSessionService,
    cancelSessionService,
    unsendSessionService,
    getConflictingSessionsService
}
