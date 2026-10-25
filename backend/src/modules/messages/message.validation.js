
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_SEND_MESSAGE_FIELDS = [
    "receiverId",
    "content"
]

const ALLOWED_GET_CONVERSATION_QUERY_FIELDS = [
    "cursor",
    "limit",
    "direction"
]


const validateSendMessage = (req, _res, next) => {

    const errors = []

    const body = req.body || {}

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const receivedFields = Object.keys(body)

    const unknownFields = receivedFields.filter(
        (field) => !ALLOWED_SEND_MESSAGE_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown message field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        receiverId,
        content
    } = body

    if(
        receiverId === undefined ||
        receiverId === null ||
        receiverId === ""
    ){
        addError(
            "receiverId",
            "Receiver ID is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof receiverId !== "string" ||
        !OBJECT_ID_REGEX.test(receiverId)
    ){
        addError(
            "receiverId",
            "Invalid receiver ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else if(receiverId === req.user._id.toString()){
        addError(
            "receiverId",
            "Sender and receiver must be different users",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        content === undefined ||
        content === null ||
        content === ""
    ){
        addError(
            "content",
            "Message content is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof content !== "string" ||
        content.trim() === ""
    ){
        addError(
            "content",
            "Message content must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Message validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.body.content = content.trim()

    next()
}


const validateMessageUserId = (req, _res, next) => {

    const {userId} = req.params

    if(
        !userId ||
        typeof userId !== "string" ||
        !OBJECT_ID_REGEX.test(userId)
    ){
        throw new ApiError(
            400,
            "Invalid user ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(userId === req.user._id.toString()){
        throw new ApiError(
            400,
            "Conversation user must be different from logged-in user",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


const validateMessageId = (req, _res, next) => {

    const {messageId} = req.params

    if(
        !messageId ||
        typeof messageId !== "string" ||
        !OBJECT_ID_REGEX.test(messageId)
    ){
        throw new ApiError(
            400,
            "Invalid message ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


const validateGetConversationMessages = (req, _res, next) => {

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
        (field) => !ALLOWED_GET_CONVERSATION_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown conversation query field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        cursor,
        limit = "20",
        direction = "older"
    } = query

    if(
        cursor !== undefined &&
        (
            typeof cursor !== "string" ||
            !OBJECT_ID_REGEX.test(cursor)
        )
    ){
        addError(
            "cursor",
            "Cursor must be a valid message ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    const positiveIntegerPattern = /^[1-9]\d*$/

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

    if(
        typeof direction !== "string" ||
        !["older", "newer"].includes(direction)
    ){
        addError(
            "direction",
            "Direction must be either older or newer",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(query.direction !== undefined && cursor === undefined){
        addError(
            "direction",
            "Direction requires a cursor",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Conversation query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.messagePagination = {
        cursor: cursor || null,
        limit: Number(limit),
        direction
    }

    next()
}


export {
    validateSendMessage,
    validateMessageUserId,
    validateGetConversationMessages,
    validateMessageId
}
