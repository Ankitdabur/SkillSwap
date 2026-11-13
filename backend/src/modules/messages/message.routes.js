
import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import upload from "../../middlewares/multer.middleware.js"
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
router.post("/", verifyJWT, checkAccountStatus, upload.single("image"), validateSendMessage, sendMessage)
// Get users with whom the current user has chat history
router.get("/conversations", verifyJWT, checkAccountStatus, getChatHistoryUsers)
// Get paginated messages with another user
router.get( "/with/:userId", verifyJWT, checkAccountStatus, validateMessageUserId, validateGetConversationMessages, getConversationMessages)
// Mark received messages from a user as read
router.patch( "/with/:userId/read", verifyJWT, checkAccountStatus, validateMessageUserId, markConversationMessagesAsRead)
// Soft-delete a message sent by the current user
router.delete( "/:messageId", verifyJWT, checkAccountStatus, validateMessageId, deleteMessage)


export default router
