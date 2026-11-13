import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_CREATE_REVIEW_FIELDS = [
    "sessionId",
    "rating",
    "comment"
]

const ALLOWED_GET_REVIEWS_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/


const validateCreateReview = (req, _res, next) => {

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
        (field) => !ALLOWED_CREATE_REVIEW_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Review field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        sessionId,
        rating,
        comment
    } = body

    if(
        sessionId === undefined ||
        sessionId === null ||
        sessionId === ""
    ){
        addError(
            "sessionId",
            "Session ID is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof sessionId !== "string" ||
        !OBJECT_ID_REGEX.test(sessionId)
    ){
        addError(
            "sessionId",
            "Invalid Session ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        rating === undefined ||
        rating === null ||
        rating === ""
    ){
        addError(
            "rating",
            "Rating is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ){
        addError(
            "rating",
            "Rating must be an integer from 1 to 5",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        comment !== undefined &&
        comment !== null &&
        (
            typeof comment !== "string" ||
            comment.trim() === "" ||
            comment.trim().length > 1000
        )
    ){
        addError(
            "comment",
            "Comment must be a non-empty string with at most 1000 characters",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Review creation validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.reviewData = {
        sessionId,
        rating,
        comment: comment?.trim() || null
    }

    next()
}


const validateGetUserReviews = (req, _res, next) => {

    const errors = []
    const query = req.query || {}

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const {userId} = req.params

    if(
        !userId ||
        typeof userId !== "string" ||
        !OBJECT_ID_REGEX.test(userId)
    ){
        addError(
            "userId",
            "Invalid user ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    const unknownFields = Object.keys(query).filter(
        (field) => !ALLOWED_GET_REVIEWS_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Review query field: ${field}`,
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
            "Cursor must be a valid Review ID",
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
            "Review query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.reviewPagination = {
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}


export {
    validateCreateReview,
    validateGetUserReviews
}
