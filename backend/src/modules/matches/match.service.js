import mongoose from "mongoose"
import Match from "../../models/match.model.js"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    MATCH_STATUSES,
    NOTIFICATION_TYPES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"


const sendMatchRequestService = async (senderId, receiverId) => {

    const pairKey = [
        senderId.toString(),
        receiverId.toString()
    ]
        .sort()
        .join(":")

    const session = await mongoose.startSession()

    let match

    try {
        await session.withTransaction(async () => {

            const receiverExists = await User.exists({
                _id: receiverId
            }).session(session)

            if(!receiverExists){
                throw new ApiError(
                    404,
                    "Receiver not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            const sender = await User.findById(senderId)
            .select("username")
            .session(session)

            if(!sender){
                throw new ApiError(
                    404,
                    "Sender not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            const existingMatch = await Match.findOne({pairKey})
            .session(session)

            if(existingMatch){
                let message = "Match already exists"

                if(existingMatch.status === MATCH_STATUSES.PENDING){
                    message = "Pending Match request already exists"
                }else if(existingMatch.status === MATCH_STATUSES.ACCEPTED){
                    message = "Users are already matched"
                }else if(existingMatch.status === MATCH_STATUSES.BLOCKED){
                    message = "Match request cannot be created"
                }

                throw new ApiError(
                    409,
                    message,
                    ERROR_CODES.RESOURCE_ALREADY_EXISTS
                )
            }

            const createdMatches = await Match.create(
                [
                    {
                        sender: senderId,
                        receiver: receiverId
                    }
                ],
                {
                    session
                }
            )

            match = await Match.findById(createdMatches[0]._id)
            .session(session)

            await createNotificationService(
                {
                    recipient: receiverId,
                    type: NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
                    message: `${sender.username} sent you a Match request`
                },
                session
            )
        })
    } catch (error) {
        if(error?.code === 11000){
            throw new ApiError(
                409,
                "Match already exists",
                ERROR_CODES.RESOURCE_ALREADY_EXISTS
            )
        }

        throw error
    } finally {
        await session.endSession()
    }

    return {match}
}

const getIncomingPendingMatchesService = async (loggedInUser) => {

        const pendingMatches = await Match.find({
                receiver: loggedInUser,
                status: MATCH_STATUSES.PENDING
            }).sort({
                createdAt: -1
            })

    return {pendingMatches}
}


const getOutgoingPendingMatchesService = async (loggedInUser) => {

    const pendingMatches = await Match.find({
        sender: loggedInUser,
        status: MATCH_STATUSES.PENDING
    }).sort({
        createdAt: -1
    })

    return {pendingMatches}
}


const getAcceptedMatchesService = async (loggedInUser) => {

    const acceptedMatches = await Match.find({
        status: MATCH_STATUSES.ACCEPTED,
        $or: [
            {
                sender: loggedInUser
            },
            {
                receiver: loggedInUser
            }
        ]
    }).sort({
        createdAt: -1
    })

    return {acceptedMatches}
}


const getBlockedMatchesService = async (loggedInUser) => {

    const blockedMatches = await Match.find({
        status: MATCH_STATUSES.BLOCKED,
        blockedBy: loggedInUser
    }).sort({
        createdAt: -1
    })

    return {blockedMatches}
}


const acceptMatchService = async (loggedInUser, matchId) => {

    const session = await mongoose.startSession()

    let acceptedMatch

    try {
        await session.withTransaction(async () => {

            acceptedMatch = await Match.findOneAndUpdate(
                {
                    _id: matchId,
                    receiver: loggedInUser,
                    status: MATCH_STATUSES.PENDING
                },
                {
                    status: MATCH_STATUSES.ACCEPTED
                },
                {
                    new: true,
                    runValidators: true,
                    session
                }
            )

            if(!acceptedMatch){
                const existingMatch = await Match.findById(matchId)
                .session(session)

                if(!existingMatch){
                    throw new ApiError(
                        404,
                        "Match not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                if(!existingMatch.receiver.equals(loggedInUser)){
                    throw new ApiError(
                        403,
                        "Only the Match receiver can accept this request",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                throw new ApiError(
                    409,
                    "Match request is no longer pending",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const connectionUpdateResult = await User.updateMany(
                {
                    _id: {
                        $in: [
                            acceptedMatch.sender,
                            acceptedMatch.receiver
                        ]
                    }
                },
                {
                    $inc: {
                        connections: 1
                    } 
                },
                {
                    session
                }
            )

            if(connectionUpdateResult.matchedCount !== 2){
                throw new ApiError(
                    404,
                    "Match participant not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            const receiver = await User.findById(loggedInUser)
            .select("username")
            .session(session)

            await createNotificationService(
                {
                    recipient: acceptedMatch.sender,
                    type: NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED,
                    message: `${receiver.username} accepted your Match request`
                },
                session
            )
        })
    } finally {
        await session.endSession()
    }

    return {match: acceptedMatch}
}


const rejectMatchService = async (loggedInUser, matchId) => {

    const session = await mongoose.startSession()

    let rejectedMatch

    try {
        await session.withTransaction(async () => {

            rejectedMatch = await Match.findOneAndDelete(
                {
                    _id: matchId,
                    receiver: loggedInUser,
                    status: MATCH_STATUSES.PENDING
                },
                {
                    session
                }
            )

            if(!rejectedMatch){
                const existingMatch = await Match.findById(matchId)
                .session(session)

                if(!existingMatch){
                    throw new ApiError(
                        404,
                        "Match not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                if(!existingMatch.receiver.equals(loggedInUser)){
                    throw new ApiError(
                        403,
                        "Only the Match receiver can reject this request",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                throw new ApiError(
                    409,
                    "Match request is no longer pending",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const receiver = await User.findById(loggedInUser)
            .select("username")
            .session(session)

            if(!receiver){
                throw new ApiError(
                    404,
                    "Match receiver not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            await createNotificationService(
                {
                    recipient: rejectedMatch.sender,
                    type: NOTIFICATION_TYPES.MATCH_REQUEST_REJECTED,
                    message: `${receiver.username} rejected your Match request`
                },
                session
            )
        })
    } finally {
        await session.endSession()
    }

    return {match: rejectedMatch}
}


const cancelMatchService = async (loggedInUser, matchId) => {

    const cancelledMatch = await Match.findOneAndDelete({
        _id: matchId,
        sender: loggedInUser,
        status: MATCH_STATUSES.PENDING
    })

    if(!cancelledMatch){
        const existingMatch = await Match.findById(matchId)

        if(!existingMatch){
            throw new ApiError(
                404,
                "Match not found",
                ERROR_CODES.RESOURCE_NOT_FOUND
            )
        }

        if(!existingMatch.sender.equals(loggedInUser)){
            throw new ApiError(
                403,
                "Only the Match sender can cancel this request",
                ERROR_CODES.FORBIDDEN
            )
        }

        throw new ApiError(
            409,
            "Match request is no longer pending",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    return {match: cancelledMatch}
}


const removeMatchService = async (loggedInUser, matchId) => {

    const session = await mongoose.startSession()

    let removedMatch

    try {
        await session.withTransaction(async () => {

            removedMatch = await Match.findOneAndDelete(
                {
                    _id: matchId,
                    status: MATCH_STATUSES.ACCEPTED,
                    $or: [
                        {
                            sender: loggedInUser
                        },
                        {
                            receiver: loggedInUser
                        }
                    ]
                },
                {
                    session
                }
            )

            if(!removedMatch){
                const existingMatch = await Match.findById(matchId)
                .session(session)

                if(!existingMatch){
                    throw new ApiError(
                        404,
                        "Match not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                const isParticipant =
                    existingMatch.sender.equals(loggedInUser) ||
                    existingMatch.receiver.equals(loggedInUser)

                if(!isParticipant){
                    throw new ApiError(
                        403,
                        "Only a Match participant can remove this Match",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                throw new ApiError(
                    409,
                    "Only an accepted Match can be removed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }


            const connectionUpdateResult = await User.updateMany(
                {
                    _id: {
                        $in: [
                                removedMatch.sender,
                                removedMatch.receiver
                            ]
                    },
                    connections: {
                        $gte: 1
                    }
                },
                {
                    $inc: {
                        connections: -1
                    }
                },
                {
                    session
                }
            )

            if(connectionUpdateResult.matchedCount !== 2){
                const participantCount = await User.countDocuments({
                    _id: {
                        $in: [
                                removedMatch.sender,
                                removedMatch.receiver
                            ]
                    }
                }).session(session)

                if(participantCount !== 2){
                    throw new ApiError(
                        404,
                        "Match participant not found",
                        ERROR_CODES.USER_NOT_FOUND
                    )
                }

                throw new ApiError(
                    409,
                    "Connection count cannot be decreased",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const removingUser = await User.findById(loggedInUser)
            .select("username")
            .session(session)

            const notificationRecipient = removedMatch.sender.equals(
                loggedInUser
            )
                ? removedMatch.receiver
                : removedMatch.sender

            await createNotificationService(
                {
                    recipient: notificationRecipient,
                    type: NOTIFICATION_TYPES.MATCH_REMOVED,
                    message: `${removingUser.username} removed your Match`
                },
                session
            )
        })
    } finally {
        await session.endSession()
    }

    return {match: removedMatch}
}


const blockUserService = async (loggedInUser, userId) => {

    const pairKey = [
                loggedInUser.toString(),
                userId.toString()
            ]
                .sort()
                .join(":")


    const session = await mongoose.startSession()

    let blockedMatch

    try {
        await session.withTransaction(async () => {

            const userExists = await User.exists({_id: userId}).session(session)

            if(!userExists){
                throw new ApiError(
                    404,
                    "User not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

        
            const existingMatch = await Match.findOne({pairKey}).session(session)

            if(existingMatch?.status === MATCH_STATUSES.ACCEPTED){
                existingMatch.status = MATCH_STATUSES.BLOCKED
                existingMatch.blockedBy = loggedInUser

                blockedMatch = await existingMatch.save({session})

                const connectionUpdateResult = await User.updateMany(
                    {
                        _id: {
                            $in: [
                                existingMatch.sender,
                                existingMatch.receiver
                            ]
                        },
                        connections: {
                            $gte: 1
                        }
                    },
                    {
                        $inc: {
                            connections: -1
                        }
                    },
                    {
                        session
                    }
                )

                if(connectionUpdateResult.matchedCount !== 2){
                    throw new ApiError(
                        409,
                        "Connection count cannot be decreased",
                        ERROR_CODES.INVALID_REQUEST
                    )
                }
            }else if(existingMatch?.status === MATCH_STATUSES.BLOCKED){
                throw new ApiError(
                    409,
                    "A block already exists between these users",
                    ERROR_CODES.RESOURCE_ALREADY_EXISTS
                )
            }else if(existingMatch?.status === MATCH_STATUSES.PENDING){
                existingMatch.status = MATCH_STATUSES.BLOCKED
                existingMatch.blockedBy = loggedInUser

                blockedMatch = await existingMatch.save({session})
            }else{
                const createdMatches = await Match.create(
                    [
                        {
                            sender: loggedInUser,
                            receiver: userId,
                            status: MATCH_STATUSES.BLOCKED,
                            blockedBy: loggedInUser
                        }
                    ],
                    {
                        session
                    }
                )

                blockedMatch = await Match.findById(createdMatches[0]._id).session(session)
            }
        })
    } catch (error) {
        if(error?.code === 11000){
            throw new ApiError(
                409,
                "A Match already exists between these users",
                ERROR_CODES.RESOURCE_ALREADY_EXISTS
            )
        }

        throw error
    } finally {
        await session.endSession()
    }

    return {match: blockedMatch}
}


const unblockUserService = async (loggedInUser, userId) => {

    const pairKey = [
        loggedInUser.toString(),
        userId.toString()
    ].sort()
    .join(":")

    const unblockedMatch = await Match.findOneAndDelete({
        pairKey,
        status: MATCH_STATUSES.BLOCKED,
        blockedBy: loggedInUser
    })

    if(!unblockedMatch){
        const existingMatch = await Match.findOne({pairKey})

        if(!existingMatch){
            throw new ApiError(
                404,
                "Match not found",
                ERROR_CODES.RESOURCE_NOT_FOUND
            )
        }

        if(existingMatch.status !== MATCH_STATUSES.BLOCKED){
            throw new ApiError(
                409,
                "Only a blocked Match can be unblocked",
                ERROR_CODES.INVALID_REQUEST
            )
        }

        throw new ApiError(
            403,
            "Only the user who created the block can unblock it",
            ERROR_CODES.FORBIDDEN
        )
    }

    return {match: unblockedMatch}
}


export {
    sendMatchRequestService,
    getIncomingPendingMatchesService,
    getOutgoingPendingMatchesService,
    getAcceptedMatchesService,
    getBlockedMatchesService,
    acceptMatchService,
    rejectMatchService,
    cancelMatchService,
    removeMatchService,
    blockUserService,
    unblockUserService
}
