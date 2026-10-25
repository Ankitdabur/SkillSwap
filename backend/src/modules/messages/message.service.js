
import Message from "../../models/message.model.js"
import Match from "../../models/match.model.js"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { MATCH_STATUSES } from "../../constants/enums.js"


const sendMessageService = async (
    senderId,
    receiverId,
    content
) => {

    const receiverExists = await User.exists({_id: receiverId})

    if(!receiverExists){
        throw new ApiError(
            404,
            "Receiver not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    const conversationKey = [
        senderId.toString(),
        receiverId.toString()
    ]
        .sort()
        .join(":")

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

    const createdMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content
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
                }
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
