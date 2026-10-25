
import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    sendMessageService,
    getChatHistoryUsersService,
    getConversationMessagesService,
    markConversationMessagesAsReadService,
    deleteMessageService
} from "./message.service.js"


const sendMessage = asyncHandler(async (req, res) => {

    const messageData = await sendMessageService(
        req.user._id,
        req.body.receiverId,
        req.body.content
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            messageData,
            "Message sent successfully"
        )
    )
})


const getChatHistoryUsers = asyncHandler(async (req, res) => {

    const conversationsData = await getChatHistoryUsersService(
        req.user._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            conversationsData,
            "Chat history users fetched successfully"
        )
    )
})


const getConversationMessages = asyncHandler(async (req, res) => {

    const {userId} = req.params

    const {
        cursor,
        limit,
        direction
    } = req.messagePagination

    const messagesData = await getConversationMessagesService(
        req.user._id,
        userId,
        cursor,
        limit,
        direction
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            messagesData,
            "Conversation messages fetched successfully"
        )
    )
})


const markConversationMessagesAsRead = asyncHandler(async (req, res) => {

    const {userId} = req.params

    const messagesData = await markConversationMessagesAsReadService(
        req.user._id,
        userId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            messagesData,
            "Conversation messages marked as read successfully"
        )
    )
})


const deleteMessage = asyncHandler(async (req, res) => {

    const {messageId} = req.params

    const messageData = await deleteMessageService(
        req.user._id,
        messageId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            messageData,
            "Message deleted successfully"
        )
    )
})


export {
    sendMessage,
    getChatHistoryUsers,
    getConversationMessages,
    markConversationMessagesAsRead,
    deleteMessage
}
