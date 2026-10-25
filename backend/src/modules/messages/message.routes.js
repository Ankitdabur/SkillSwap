
import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import {
    validateSendMessage,
    validateMessageUserId,
    validateGetConversationMessages,
    validateMessageId
} from "./message.validation.js"
import {
    sendMessage,
    getChatHistoryUsers,
    getConversationMessages,
    markConversationMessagesAsRead,
    deleteMessage
} from "./message.controller.js"


const router = Router()


// Send a message to an accepted Match
router.post("/", verifyJWT, validateSendMessage, sendMessage)
// Get users with whom the current user has chat history
router.get("/conversations", verifyJWT, getChatHistoryUsers)
// Get paginated messages with another user
router.get( "/with/:userId", verifyJWT, validateMessageUserId, validateGetConversationMessages, getConversationMessages)
// Mark received messages from a user as read
router.patch( "/with/:userId/read", verifyJWT, validateMessageUserId, markConversationMessagesAsRead)
// Soft-delete a message sent by the current user
router.delete( "/:messageId", verifyJWT, validateMessageId, deleteMessage)


export default router
