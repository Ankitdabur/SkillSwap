
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { SKILL_CATEGORIES } from "../../constants/enums.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_CREATE_SKILL_REQUEST_FIELDS = [
    "name",
    "category",
    "description"
]

const ALLOWED_GET_SKILL_REQUEST_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const ALLOWED_APPROVE_SKILL_REQUEST_FIELDS = [
    "name",
    "displayName",
    "category",
    "description",
    "adminResponse"
]

const ALLOWED_REJECT_SKILL_REQUEST_FIELDS = [
    "adminResponse"
]


const validateCreateSkillRequest = (req, _res, next) => {

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
        (field) => !ALLOWED_CREATE_SKILL_REQUEST_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown skill request field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        name,
        category,
        description
    } = body


    // NAME


    if(
        name === undefined ||
        name === null ||
        name === ""
    ){
        addError(
            "name",
            "Skill request name is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof name !== "string" ||
        name.trim() === ""
    ){
        addError(
            "name",
            "Skill request name must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // CATEGORY


    if(
        category === undefined ||
        category === null ||
        category === ""
    ){
        addError(
            "category",
            "Skill request category is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof category !== "string" ||
        !Object.values(SKILL_CATEGORIES).includes(category)
    ){
        addError(
            "category",
            "Invalid skill request category",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // DESCRIPTION


    if(
        description === undefined ||
        description === null ||
        description === ""
    ){
        addError(
            "description",
            "Skill request description is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof description !== "string" ||
        description.trim() === ""
    ){
        addError(
            "description",
            "Skill request description must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    if(errors.length > 0){
        throw new ApiError(
            400,
            "Skill request creation validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.body.name = name.trim().toLowerCase()

    next()
}

// admin get skill
const validateGetSkillRequests = (req, _res, next) => {

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
        (field) => !ALLOWED_GET_SKILL_REQUEST_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown skill request query field: ${field}`,
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
            "Cursor must be a valid skill request ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    const positiveIntegerPattern = /^[1-9]\d*$/

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
            "Skill request query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.pagination = {
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}

// admin approve & reject
const validateSkillRequestId = (req, _res, next) => {

    const {skillRequestId} = req.params

    if(
        !skillRequestId ||
        typeof skillRequestId !== "string" ||
        !OBJECT_ID_REGEX.test(skillRequestId)
    ){
        throw new ApiError(
            400,
            "Invalid skill request ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}

// admin aprove
const validateApproveSkillRequest = (req, _res, next) => {

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
        (field) => !ALLOWED_APPROVE_SKILL_REQUEST_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown skill request approval field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        name,
        displayName,
        category,
        description,
        adminResponse
    } = body


    // NAME


    if(
        name === undefined ||
        name === null ||
        name === ""
    ){
        addError(
            "name",
            "Skill name is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof name !== "string" ||
        name.trim() === ""
    ){
        addError(
            "name",
            "Skill name must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // DISPLAY NAME


    if(
        displayName === undefined ||
        displayName === null ||
        displayName === ""
    ){
        addError(
            "displayName",
            "Skill display name is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof displayName !== "string" ||
        displayName.trim() === ""
    ){
        addError(
            "displayName",
            "Skill display name must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // CATEGORY


    if(
        category === undefined ||
        category === null ||
        category === ""
    ){
        addError(
            "category",
            "Skill category is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof category !== "string" ||
        !Object.values(SKILL_CATEGORIES).includes(category)
    ){
        addError(
            "category",
            "Invalid skill category",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // DESCRIPTION


    if(
        description === undefined ||
        description === null ||
        description === ""
    ){
        addError(
            "description",
            "Skill description is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof description !== "string" ||
        description.trim() === ""
    ){
        addError(
            "description",
            "Skill description must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    // ADMIN RESPONSE


    if(
        adminResponse !== undefined &&
        (
            typeof adminResponse !== "string" ||
            adminResponse.trim() === ""
        )
    ){
        addError(
            "adminResponse",
            "Admin response must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }


    if(errors.length > 0){
        throw new ApiError(
            400,
            "Skill request approval validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.body.name = name.trim().toLowerCase()

    if(adminResponse !== undefined){
        req.body.adminResponse = adminResponse.trim()
    }

    next()
}

// admin reject
const validateRejectSkillRequest = (req, _res, next) => {

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
        (field) => !ALLOWED_REJECT_SKILL_REQUEST_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown skill request rejection field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {adminResponse} = body

    if(
        adminResponse === undefined ||
        adminResponse === null ||
        adminResponse === ""
    ){
        addError(
            "adminResponse",
            "Admin response is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof adminResponse !== "string" ||
        adminResponse.trim() === ""
    ){
        addError(
            "adminResponse",
            "Admin response must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Skill request rejection validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.body.adminResponse = adminResponse.trim()

    next()
}


export {
    validateCreateSkillRequest,
    validateGetSkillRequests,
    validateSkillRequestId,
    validateApproveSkillRequest,
    validateRejectSkillRequest
}
