import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_CREATE_REPORT_FIELDS = [
    "sessionId",
    "messageId",
    "reason"
]

const ALLOWED_GET_REPORTS_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/


const validateCreateReport = (req, _res, next) => {

    const errors = []
    const body = req.body || {}

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const unknownFields = Object.keys(body).filter(
        (field) => !ALLOWED_CREATE_REPORT_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Report field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        sessionId,
        messageId,
        reason
    } = body

    const referenceCount = Number(Boolean(sessionId)) +
        Number(Boolean(messageId))

    if(referenceCount !== 1){
        addError(
            "reference",
            "Exactly one Session ID or Message ID is required",
            ERROR_CODES.INVALID_REQUEST
        )
    }

    if(
        sessionId !== undefined &&
        sessionId !== null &&
        sessionId !== "" &&
        (
            typeof sessionId !== "string" ||
            !OBJECT_ID_REGEX.test(sessionId)
        )
    ){
        addError(
            "sessionId",
            "Invalid Session ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        messageId !== undefined &&
        messageId !== null &&
        messageId !== "" &&
        (
            typeof messageId !== "string" ||
            !OBJECT_ID_REGEX.test(messageId)
        )
    ){
        addError(
            "messageId",
            "Invalid Message ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        reason === undefined ||
        reason === null ||
        reason === ""
    ){
        addError(
            "reason",
            "Report reason is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof reason !== "string" ||
        reason.trim() === "" ||
        reason.trim().length > 1000
    ){
        addError(
            "reason",
            "Report reason must be a non-empty string of at most 1000 characters",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Report creation validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.reportData = {
        sessionId: sessionId || null,
        messageId: messageId || null,
        reason: reason.trim()
    }

    next()
}


const validateGetMyReports = (req, _res, next) => {

    const errors = []
    const query = req.query || {}

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const unknownFields = Object.keys(query).filter(
        (field) => !ALLOWED_GET_REPORTS_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Report query field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        cursor,
        limit = "10"
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
            "Cursor must be a valid Report ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        typeof limit !== "string" ||
        !POSITIVE_INTEGER_PATTERN.test(limit) ||
        Number(limit) > 100
    ){
        addError(
            "limit",
            "Limit must be a positive integer between 1 and 100",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Report query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.reportPagination = {
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}


export {
    validateCreateReport,
    validateGetMyReports
}
