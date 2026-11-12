
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const ALLOWED_GET_CREDIT_TRANSACTION_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/


const validateGetCreditTransactions = (req, _res, next) => {

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
        (field) =>
            !ALLOWED_GET_CREDIT_TRANSACTION_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown CreditTransaction query field: ${field}`,
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
            "Cursor must be a valid CreditTransaction ID",
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
            "CreditTransaction query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.creditTransactionPagination = {
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}


export {validateGetCreditTransactions}
