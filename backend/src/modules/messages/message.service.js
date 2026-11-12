import Message from "../../models/message.model.js"
import Match from "../../models/match.model.js"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import uploadOnCloudinary from "../../utils/cloudinary.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    MATCH_STATUSES,
    MESSAGE_TYPES,
    SESSION_STATUSES,
    USER_ROLES
} from "../../constants/enums.js"


const sendMessageService = async (
    senderId,
    receiverId,
    content,
    imageLocalPath
) => {

    const sender = await User.findById(senderId).select("role")
    const receiver = await User.findById(receiverId).select("role")

    if(!receiver){
        throw new ApiError(
            404,
            "Receiver not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    if(!sender){
        throw new ApiError(
            401,
            "Sender not found",
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    }

    const conversationKey = [
        senderId.toString(),
        receiverId.toString()
    ]
        .sort()
        .join(":")

    const senderIsAdmin = sender.role === USER_ROLES.ADMIN
    const receiverIsAdmin = receiver.role === USER_ROLES.ADMIN

    let messageType = MESSAGE_TYPES.TEXT

    if(senderIsAdmin || receiverIsAdmin){
        const participantId = senderIsAdmin
            ? receiverId
            : senderId

        const activeReview = await Session.exists({
            status: SESSION_STATUSES.UNDER_REVIEW,
            $or: [
                {
                    teacher: participantId
                },
                {
                    learner: participantId
                }
            ]
        })

        if(!activeReview){
            throw new ApiError(
                403,
                "Admin review conversation is read-only",
                ERROR_CODES.FORBIDDEN
            )
        }

        if(receiverIsAdmin){
            const reviewConversationStarted = await Message.exists({
                sender: receiverId,
                receiver: senderId,
                messageType: MESSAGE_TYPES.ADMIN_REVIEW
            })

            if(!reviewConversationStarted){
                throw new ApiError(
                    403,
                    "Only the admin can start a review conversation",
                    ERROR_CODES.FORBIDDEN
                )
            }
        }

        messageType = MESSAGE_TYPES.ADMIN_REVIEW
    }else{
        const acceptedMatch = await Match.exists({
            pairKey: conversationKey,
            status: MATCH_STATUSES.ACCEPTED
        })

        if(!acceptedMatch){
            throw new ApiError(
                403,
                "Messages can only be sent between accepted Matches",
                ERROR_CODES.FORBIDDEN
            )
        }
    }

    let imageUrl = null

    if(imageLocalPath){
        const uploadedImage = await uploadOnCloudinary(imageLocalPath)

        if(!uploadedImage?.secure_url){
            throw new ApiError(
                500,
                "Message image upload failed",
                ERROR_CODES.INTERNAL_SERVER_ERROR
            )
        }

        imageUrl = uploadedImage.secure_url
    }

    const createdMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        messageType,
        content,
        imageUrl
    })

    const message = await Message.findById(createdMessage._id)

    return {message}
}


const getChatHistoryUsersService = async (loggedInUser) => {

    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [
                    {
                        sender: loggedInUser
                    },
                    {
                        receiver: loggedInUser
                    }
                ]
            }
        },
        {
            $sort: {
                createdAt: -1,
                _id: -1
            }
        },
        {
            $group: {
                _id: "$conversationKey",
                lastMessage: {
                    $first: "$$ROOT"
                },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $eq: ["$receiver", loggedInUser]
                                    },
                                    {
                                        $eq: ["$isRead", false]
                                    }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $set: {
                otherUserId: {
                    $cond: [
                        {
                            $eq: ["$lastMessage.sender", loggedInUser]
                        },
                        "$lastMessage.receiver",
                        "$lastMessage.sender"
                    ]
                },
                // lastMessage: {
                //     content: {      can do this also
                //         $cond: {
                //             if: "$lastMessage.isDeleted",
                //             then: "Message is deleted",
                //             else: "$lastMessage.content"
                //         }
                //     }
                // },
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "otherUserId",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $sort: {
                "lastMessage.createdAt": -1,
                "lastMessage._id": -1
            }
        },
        {
            $project: {
                _id: 0,
                user: {
                    _id: "$user._id",
                    username: "$user.username",
                    fullname: "$user.fullname",
                    avatar: "$user.avatar"
                },
                lastMessage: {
                    content: {
                        $cond: {
                            if: "$lastMessage.isDeleted",
                            then: "Message is deleted",
                            else: "$lastMessage.content"
                        }
                    },
                    imageUrl: {
                        $cond: {
                            if: "$lastMessage.isDeleted",
                            then: null,
                            else: "$lastMessage.imageUrl"
                        }
                    }
                },
                unreadCount: 1
            }
        }
    ])

    return {conversations}
}


const getConversationMessagesService = async (
    loggedInUser,
    userId,
    cursor,
    limit,
    direction
) => {

    const userExists = await User.exists({_id: userId})

    if(!userExists){
        throw new ApiError(
            404,
            "User not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    const conversationKey = [
        loggedInUser.toString(),
        userId.toString()
    ]
        .sort()
        .join(":")

    let cursorMessage = null

    if(cursor){
        cursorMessage = await Message.findOne({
            _id: cursor,
            conversationKey
        }).select("createdAt")

        if(!cursorMessage){
            throw new ApiError(
                400,
                "Invalid conversation cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const sortDirection = direction === "newer" ? 1 : -1

    const conversationMessages = await Message.aggregate([
        {
            $match: {
                conversationKey
            }
        },
        ...(cursorMessage
            ? [
                {
                    $match: {
                        $or: direction === "newer"
                            ? [
                                {
                                    createdAt: {
                                        $gt: cursorMessage.createdAt
                                    }
                                },
                                {
                                    createdAt: cursorMessage.createdAt,
                                    _id: {
                                        $gt: cursorMessage._id
                                    }
                                }
                            ]
                            : [
                                {
                                    createdAt: {
                                        $lt: cursorMessage.createdAt
                                    }
                                },
                                {
                                    createdAt: cursorMessage.createdAt,
                                    _id: {
                                        $lt: cursorMessage._id
                                    }
                                }
                            ]
                    }
                }
            ]
            : []),
        {
            $sort: {
                createdAt: sortDirection,
                _id: sortDirection
            }
        },
        {
            $limit: limit + 1
        },
        {
            $set: {
                content: {
                    $cond: {
                        if : "$isDeleted",
                        then : "Message is deleted",
                        else : "$content"
                    }
                },
                imageUrl: {
                    $cond: {
                        if: "$isDeleted",
                        then: null,
                        else: "$imageUrl"
                    }
                }
            }
        },
        {
            $project: {
                conversationKey: 0
            }
        }
    ])

    const hasMore = conversationMessages.length > limit

    const cursorOrderedMessages = hasMore
        ? conversationMessages.slice(0, limit)
        : conversationMessages

    const nextCursor = hasMore
        ? cursorOrderedMessages[cursorOrderedMessages.length - 1]._id.toString()
        : null

    const messages = direction === "newer"
        ? [...cursorOrderedMessages].reverse()
        : cursorOrderedMessages

    return {
        messages,
        pagination: {
            limit,
            direction,
            nextCursor,
            hasMore
        }
    }
}


const markConversationMessagesAsReadService = async (
    loggedInUser,
    userId
) => {

    const userExists = await User.exists({_id: userId})

    if(!userExists){
        throw new ApiError(
            404,
            "User not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    const updateResult = await Message.updateMany(
        {
            sender: userId,
            receiver: loggedInUser,
            isRead: false
        },
        {
            isRead: true
        }
    )

    return {
        modifiedCount: updateResult.modifiedCount
    }
}


const deleteMessageService = async (
    loggedInUser,
    messageId
) => {

    const message = await Message.findById(messageId)

    if(!message){
        throw new ApiError(
            404,
            "Message not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    if(!message.sender.equals(loggedInUser)){
        throw new ApiError(
            403,
            "Only the Message sender can delete this Message",
            ERROR_CODES.FORBIDDEN
        )
    }

    if(message.messageType === MESSAGE_TYPES.ADMIN_REVIEW){
        throw new ApiError(
            403,
            "Admin review Messages cannot be deleted",
            ERROR_CODES.FORBIDDEN
        )
    }

    message.isDeleted = true
    await message.save()

    return {
        messageId: message._id,
        isDeleted: message.isDeleted
    }
}


export {
    sendMessageService,
    getChatHistoryUsersService,
    getConversationMessagesService,
    markConversationMessagesAsReadService,
    deleteMessageService
}
