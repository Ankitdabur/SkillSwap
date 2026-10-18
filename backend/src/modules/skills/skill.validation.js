import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { SKILL_CATEGORIES } from "../../constants/enums.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

const ALLOWED_CREATE_SKILL_FIELDS = [
    "name",
    "displayName",
    "category",
    "description"
]



const validateSkillId = (req, _res, next) => {

    const {skillId} = req.params

    if(
        !skillId ||
        typeof skillId !== "string" ||
        !OBJECT_ID_REGEX.test(skillId)
    ){
        throw new ApiError(
            400,
            "Invalid skill ID",
            ERROR_CODES.INVALID_FIELD_VALUE,
        )
    }

    next()
}

//SAME FOR PUT & PATCH
const validateCreateSkill = (req, _res, next) => {

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
        (field) => !ALLOWED_CREATE_SKILL_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown skill field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        name,
        displayName,
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


    if(errors.length > 0){
        throw new ApiError(
            400,
            "Skill creation/update validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.body.name = name.trim().toLowerCase()

    next()
}





export {
    validateSkillId,
    validateCreateSkill,
}
