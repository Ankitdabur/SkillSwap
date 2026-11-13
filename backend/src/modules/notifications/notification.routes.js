
import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    getReadNotifications,
    getUnreadNotifications
} from "./notification.controller.js"
import {
    validateGetNotifications,
    validateNotificationId
} from "./notification.validation.js"


const router = Router()


// Get all notifications with pagination
router.get("/", verifyJWT, checkAccountStatus, validateGetNotifications, getNotifications)
// Get the current user's unread notification count
router.get("/unread-count", verifyJWT, checkAccountStatus, getUnreadNotificationCount)
// Get read notifications with pagination
router.get("/read", verifyJWT, checkAccountStatus, validateGetNotifications, getReadNotifications)
// Get unread notifications with pagination
router.get("/unread", verifyJWT, checkAccountStatus, validateGetNotifications, getUnreadNotifications)
// Mark all current notifications as read
router.patch("/read-all", verifyJWT, checkAccountStatus, markAllNotificationsAsRead)
// Mark one notification as read
router.patch("/:notificationId/read", verifyJWT, checkAccountStatus, validateNotificationId, markNotificationAsRead)


export default router
