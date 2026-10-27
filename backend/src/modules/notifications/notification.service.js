import Notification from "../../models/notification.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const createNotificationService = async (
    notificationData,
    session = null
) => {

    let notification

    if(session){
        const notifications = await Notification.create(
            [notificationData],
            {
                session
            }
        )

        notification = notifications[0]
    }else{
        notification = await Notification.create(notificationData)
    }

    return {notification}
}


const getNotificationsByFilterService = async (
    notificationFilter,
    cursor,
    limit
) => {

    let cursorNotification = null

    if(cursor){
        cursorNotification = await Notification.findOne({
            ...notificationFilter,
            _id: cursor
        }).select("createdAt")

        if(!cursorNotification){
            throw new ApiError(
                400,
                "Invalid notification cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const paginatedFilter = {
        ...notificationFilter,
        ...(cursorNotification
            ? {
                $or: [
                    {
                        createdAt: {
                            $lt: cursorNotification.createdAt
                        }
                    },
                    {
                        createdAt: cursorNotification.createdAt,
                        _id: {
                            $lt: cursorNotification._id
                        }
                    }
                ]
            }
            : {})
    }

    const notificationResults = await Notification.find(
        paginatedFilter
    )
    .sort({
        createdAt: -1,
        _id: -1
    })
    .limit(limit + 1)

    const hasMore = notificationResults.length > limit

    const notifications = hasMore
        ? notificationResults.slice(0, limit)
        : notificationResults

    const nextCursor = hasMore
        ? notifications[notifications.length - 1]._id.toString()
        : null

    return {
        notifications,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


const getNotificationsService = async (
    loggedInUser,
    cursor,
    limit
) => {

    return getNotificationsByFilterService(
        {
            recipient: loggedInUser
        },
        cursor,
        limit
    )
}


const markNotificationAsReadService = async (
    loggedInUser,
    notificationId
) => {

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: loggedInUser
        },
        {
            isRead: true
        },
        {
            new: true,
            runValidators: true
        }
    )

    if(!notification){
        throw new ApiError(
            404,
            "Notification not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    return {notification}
}


const markAllNotificationsAsReadService = async (loggedInUser) => {

    const updateResult = await Notification.updateMany(
        {
            recipient: loggedInUser,
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


const getUnreadNotificationCountService = async (loggedInUser) => {

    const unreadCount = await Notification.countDocuments({
        recipient: loggedInUser,
        isRead: false
    })

    return {unreadCount}
}


const getNotificationsByReadStatusService = async (
    loggedInUser,
    isRead,
    cursor,
    limit
) => {

    return getNotificationsByFilterService(
        {
            recipient: loggedInUser,
            isRead
        },
        cursor,
        limit
    )
}


export {
    createNotificationService,
    getNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
    getUnreadNotificationCountService,
    getNotificationsByReadStatusService
}
