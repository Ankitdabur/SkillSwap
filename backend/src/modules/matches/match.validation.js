import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_SEND_MATCH_REQUEST_FIELDS = [
    "receiverId"
]


const validateSendMatchRequest = (req, _res, next) => {

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
        (field) => !ALLOWED_SEND_MATCH_REQUEST_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Match request field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        receiverId
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
    }else if(req.user._id.toString() === receiverId){
        addError(
            "receiverId",
            "You cannot send a Match request to yourself",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Match request validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    next()
}


const validateMatchId = (req, _res, next) => {

    const {matchId} = req.params

    if(
        !matchId ||
        typeof matchId !== "string" ||
        !OBJECT_ID_REGEX.test(matchId)
    ){
        throw new ApiError(
            400,
            "Invalid Match ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


const validateMatchUserId = (req, _res, next) => {

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

    if(req.user._id.toString() === userId){
        throw new ApiError(
            400,
            "You cannot perform this Match action on yourself",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


export {
    validateSendMatchRequest,
    validateMatchId,
    validateMatchUserId
}
