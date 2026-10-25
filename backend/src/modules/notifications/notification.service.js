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


const getNotificationsService = async (loggedInUser, page, limit) => {

    const skip = (page - 1) * limit

    const notifications = await Notification.find({
        recipient: loggedInUser
    }).sort({
        createdAt: -1
    })
    .skip(skip)
    .limit(limit)

    const totalNotifications = await Notification.countDocuments({
        recipient: loggedInUser
    })

    const totalPages = Math.ceil(totalNotifications / limit)

    return {
        notifications,
        pagination: {
            page,
            limit,
            totalNotifications,
            totalPages
        }
    }
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
    page,
    limit
) => {

    const skip = (page - 1) * limit

    const notificationFilter = {
        recipient: loggedInUser,
        isRead
    }

    const notifications = await Notification.find(notificationFilter)
    .sort({
        createdAt: -1
    })
    .skip(skip)
    .limit(limit)

    const totalNotifications = await Notification.countDocuments(
        notificationFilter
    )

    const totalPages = Math.ceil(totalNotifications / limit)

    return {
        notifications,
        pagination: {
            page,
            limit,
            totalNotifications,
            totalPages
        }
    }
}


export {
    createNotificationService,
    getNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
    getUnreadNotificationCountService,
    getNotificationsByReadStatusService
}
