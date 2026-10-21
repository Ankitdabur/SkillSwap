
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { TEACHING_STYLES } from "../../constants/enums.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_TEACHER_DISCOVERY_QUERY_FIELDS = [
    "skillId",
    "teachingStyle",
    "page",
    "limit"
]


const validateTeacherDiscovery = (req, _res, next) => {

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
        (field) => !ALLOWED_TEACHER_DISCOVERY_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown teacher discovery query field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        skillId,
        teachingStyle,
        page = "1",
        limit = "10"
    } = query

    if(
        skillId === undefined ||
        skillId === null ||
        skillId === ""
    ){
        addError(
            "skillId",
            "Skill ID is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof skillId !== "string" ||
        !OBJECT_ID_REGEX.test(skillId)
    ){
        addError(
            "skillId",
            "Invalid skill ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        teachingStyle !== undefined &&
        (
            typeof teachingStyle !== "string" ||
            !Object.values(TEACHING_STYLES).includes(teachingStyle)
        )
    ){
        addError(
            "teachingStyle",
            "Invalid teaching style",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

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
            "Teacher discovery validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.discoveryQuery = {
        skillId,
        teachingStyle,
        page: Number(page),
        limit: Number(limit)
    }

    next()
}


export {
    validateTeacherDiscovery
}
