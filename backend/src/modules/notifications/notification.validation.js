
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const ALLOWED_GET_NOTIFICATION_QUERY_FIELDS = [
    "page",
    "limit"
]

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/


const validateGetNotifications = (req, _res, next) => {

    const errors = []

    const query = req.query || {}

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const receivedFields = Object.keys(query)

    const unknownFields = receivedFields.filter(
        (field) => !ALLOWED_GET_NOTIFICATION_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown notification query field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        page = "1",
        limit = "20"
    } = query

    const positiveIntegerPattern = /^[1-9]\d*$/

    if(
        typeof page !== "string" ||
        !positiveIntegerPattern.test(page)
    ){
        addError(
            "page",
            "Page must be a positive integer",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        typeof limit !== "string" ||
        !positiveIntegerPattern.test(limit) ||
        Number(limit) > 50
    ){
        addError(
            "limit",
            "Limit must be a positive integer between 1 and 50",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Notification query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.pagination = {
        page: Number(page),
        limit: Number(limit)
    }

    next()
}


const validateNotificationId = (req, _res, next) => {

    const {notificationId} = req.params

    if(
        !notificationId ||
        typeof notificationId !== "string" ||
        !OBJECT_ID_REGEX.test(notificationId)
    ){
        throw new ApiError(
            400,
            "Invalid notification ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


export {
    validateGetNotifications,
    validateNotificationId
}
