
import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    getNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
    getUnreadNotificationCountService,
    getNotificationsByReadStatusService
} from "./notification.service.js"


const getNotifications = asyncHandler(async (req, res) => {

    const {
        cursor,
        limit
    } = req.pagination

    const notificationsData = await getNotificationsService(
        req.user._id,
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationsData,
            "Notifications fetched successfully"
        )
    )
})


const markNotificationAsRead = asyncHandler(async (req, res) => {

    const {notificationId} = req.params

    const notificationData = await markNotificationAsReadService(
        req.user._id,
        notificationId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationData,
            "Notification marked as read successfully"
        )
    )
})


const markAllNotificationsAsRead = asyncHandler(async (req, res) => {

    const notificationsData = await markAllNotificationsAsReadService(
        req.user._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationsData,
            "All notifications marked as read successfully"
        )
    )
})


const getUnreadNotificationCount = asyncHandler(async (req, res) => {

    const notificationCountData = await getUnreadNotificationCountService(
        req.user._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationCountData,
            "Unread notification count fetched successfully"
        )
    )
})


const getReadNotifications = asyncHandler(async (req, res) => {

    const {
        cursor,
        limit
    } = req.pagination

    const notificationsData = await getNotificationsByReadStatusService(
        req.user._id,
        true,
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationsData,
            "Read notifications fetched successfully"
        )
    )
})


const getUnreadNotifications = asyncHandler(async (req, res) => {

    const {
        cursor,
        limit
    } = req.pagination

    const notificationsData = await getNotificationsByReadStatusService(
        req.user._id,
        false,
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            notificationsData,
            "Unread notifications fetched successfully"
        )
    )
})


export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    getReadNotifications,
    getUnreadNotifications
}
