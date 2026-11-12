import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { SESSION_STATUSES } from "../../constants/enums.js"


const ALLOWED_GET_UNDER_REVIEW_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const ALLOWED_RESOLVE_SESSION_REVIEW_FIELDS = [
    "resolution",
    "adminResponse"
]

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/


const validateGetUnderReviewSessions = (req, _res, next) => {

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
        (field) => !ALLOWED_GET_UNDER_REVIEW_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown admin Session query field: ${field}`,
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
            "Cursor must be a valid Session ID",
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
            "Admin Session query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.adminSessionPagination = {
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}


const validateResolveSessionReview = (req, _res, next) => {

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
        (field) => !ALLOWED_RESOLVE_SESSION_REVIEW_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Session resolution field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        resolution,
        adminResponse
    } = body

    if(
        resolution === undefined ||
        resolution === null ||
        resolution === ""
    ){
        addError(
            "resolution",
            "Session resolution is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(![
        SESSION_STATUSES.COMPLETED,
        SESSION_STATUSES.CANCELLED
    ].includes(resolution)){
        addError(
            "resolution",
            "Session resolution must be COMPLETED or CANCELLED",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(adminResponse !== undefined){
        if(
            typeof adminResponse !== "string" ||
            adminResponse.trim() === "" ||
            adminResponse.trim().length > 500
        ){
            addError(
                "adminResponse",
                "Admin response must be a non-empty string of at most 500 characters",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Session resolution validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.adminSessionResolutionData = {
        resolution,
        adminResponse: adminResponse === undefined
            ? null
            : adminResponse.trim()
    }

    next()
}


export {
    validateGetUnderReviewSessions,
    validateResolveSessionReview
}
