import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../constants/enums.js"


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

const ALLOWED_CREATE_SESSION_FIELDS = [
    "teacherId",
    "skillId",
    "date",
    "time",
    "duration",
    "sessionType",
    "credits"
]

const ALLOWED_GET_SESSION_QUERY_FIELDS = [
    "cursor",
    "limit"
]

const ALLOWED_ACCEPT_SESSION_FIELDS = [
    "meetingLink",
    "teacherResponse"
]

const ALLOWED_REJECT_SESSION_FIELDS = [
    "teacherResponse"
]

const ALLOWED_SESSION_LIST_STATUSES = [
    SESSION_STATUSES.PENDING,
    SESSION_STATUSES.ACCEPTED,
    SESSION_STATUSES.REJECTED,
    SESSION_STATUSES.COMPLETED,
    SESSION_STATUSES.CANCELLED,
    SESSION_STATUSES.COMPLETION_PENDING
]


const validateCreateSession = (req, _res, next) => {

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
        (field) => !ALLOWED_CREATE_SESSION_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Session request field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        teacherId,
        skillId,
        date,
        time,
        duration,
        sessionType,
        credits
    } = body

    if(
        teacherId === undefined ||
        teacherId === null ||
        teacherId === ""
    ){
        addError(
            "teacherId",
            "Teacher ID is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof teacherId !== "string" ||
        !OBJECT_ID_REGEX.test(teacherId)
    ){
        addError(
            "teacherId",
            "Invalid teacher ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else if(req.user._id.toString() === teacherId){
        addError(
            "teacherId",
            "Teacher and learner must be different users",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

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

    let validDate = false

    if(
        date === undefined ||
        date === null ||
        date === ""
    ){
        addError(
            "date",
            "Session date is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof date !== "string" ||
        !DATE_REGEX.test(date)
    ){
        addError(
            "date",
            "Session date must use YYYY-MM-DD format",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else{
        const calendarDate = new Date(`${date}T00:00:00.000Z`)

        validDate = (
            !Number.isNaN(calendarDate.getTime()) &&
            calendarDate.toISOString().slice(0, 10) === date
        )

        if(!validDate){
            addError(
                "date",
                "Invalid Session date",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    let validTime = false

    if(
        time === undefined ||
        time === null ||
        time === ""
    ){
        addError(
            "time",
            "Session time is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof time !== "string" ||
        !TIME_REGEX.test(time)
    ){
        addError(
            "time",
            "Session time must use HH:mm format",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else{
        validTime = true
    }

    let scheduledAt = null

    if(validDate && validTime){
        scheduledAt = new Date(`${date}T${time}:00+05:30`)

        if(scheduledAt <= new Date()){
            addError(
                "date",
                "Session must be scheduled in the future",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    if(
        duration === undefined ||
        duration === null ||
        duration === ""
    ){
        addError(
            "duration",
            "Session duration is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof duration !== "number" ||
        !Object.values(SESSION_DURATIONS).includes(duration)
    ){
        addError(
            "duration",
            "Invalid Session duration",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    const validSessionType = (
        typeof sessionType === "string" &&
        Object.values(SESSION_TYPES).includes(sessionType)
    )

    if(
        sessionType === undefined ||
        sessionType === null ||
        sessionType === ""
    ){
        addError(
            "sessionType",
            "Session type is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(!validSessionType){
        addError(
            "sessionType",
            "Invalid Session type",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(
        credits === undefined ||
        credits === null ||
        credits === ""
    ){
        addError(
            "credits",
            "Session credits are required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof credits !== "number" ||
        !Number.isInteger(credits)
    ){
        addError(
            "credits",
            "Session credits must be a whole number",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else if(
        validSessionType &&
        sessionType === SESSION_TYPES.DEMO &&
        credits !== 0
    ){
        addError(
            "credits",
            "Demo Sessions require zero credits",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else if(
        validSessionType &&
        sessionType === SESSION_TYPES.REGULAR &&
        credits <= 0
    ){
        addError(
            "credits",
            "Regular Sessions require positive credits",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Session request validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.sessionData = {
        teacherId,
        skillId,
        scheduledAt,
        duration,
        sessionType,
        credits
    }

    next()
}


const validateGetSessionsByStatus = (req, _res, next) => {

    const errors = []

    const query = req.query || {}
    const {status} = req.params

    const addError = (field, message, code) => {
        errors.push({
            field,
            message,
            code
        })
    }

    const receivedFields = Object.keys(query)

    const unknownFields = receivedFields.filter(
        (field) => !ALLOWED_GET_SESSION_QUERY_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Session query field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const sessionStatus = typeof status === "string"
        ? status.toUpperCase().replaceAll("-", "_")
        : null

    if(
        typeof status !== "string" ||
        status !== status.toLowerCase() ||
        !ALLOWED_SESSION_LIST_STATUSES.includes(sessionStatus)
    ){
        addError(
            "status",
            "Invalid Session status",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

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

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Session query validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.sessionListQuery = {
        status: sessionStatus,
        cursor: cursor || null,
        limit: Number(limit)
    }

    next()
}


const validateSessionId = (req, _res, next) => {

    const {sessionId} = req.params

    if(
        !sessionId ||
        typeof sessionId !== "string" ||
        !OBJECT_ID_REGEX.test(sessionId)
    ){
        throw new ApiError(
            400,
            "Invalid Session ID",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    next()
}


const validateAcceptSession = (req, _res, next) => {

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
        (field) => !ALLOWED_ACCEPT_SESSION_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Session acceptance field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {
        meetingLink,
        teacherResponse
    } = body

    let validMeetingLink = false

    if(
        meetingLink === undefined ||
        meetingLink === null ||
        meetingLink === ""
    ){
        addError(
            "meetingLink",
            "Meeting link is required",
            ERROR_CODES.MISSING_REQUIRED_FIELDS
        )
    }else if(
        typeof meetingLink !== "string" ||
        meetingLink.trim() === ""
    ){
        addError(
            "meetingLink",
            "Meeting link must be a non-empty string",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }else{
        try{
            validMeetingLink = new URL(meetingLink.trim()).protocol === "https:"
        }catch{
            validMeetingLink = false
        }

        if(!validMeetingLink){
            addError(
                "meetingLink",
                "Meeting link must be a valid HTTPS URL",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    if(
        teacherResponse !== undefined &&
        (
            typeof teacherResponse !== "string" ||
            teacherResponse.trim() === "" ||
            teacherResponse.trim().length > 500
        )
    ){
        addError(
            "teacherResponse",
            "Teacher response must be a non-empty string with at most 500 characters",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Session acceptance validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.sessionAcceptanceData = {
        meetingLink: meetingLink.trim(),
        teacherResponse: teacherResponse?.trim() || null
    }

    next()
}


const validateRejectSession = (req, _res, next) => {

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
        (field) => !ALLOWED_REJECT_SESSION_FIELDS.includes(field)
    )

    unknownFields.forEach((field) => {
        addError(
            field,
            `Unknown Session rejection field: ${field}`,
            ERROR_CODES.INVALID_REQUEST
        )
    })

    const {teacherResponse} = body

    if(
        teacherResponse !== undefined &&
        (
            typeof teacherResponse !== "string" ||
            teacherResponse.trim() === "" ||
            teacherResponse.trim().length > 500
        )
    ){
        addError(
            "teacherResponse",
            "Teacher response must be a non-empty string with at most 500 characters",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

    if(errors.length > 0){
        throw new ApiError(
            400,
            "Session rejection validation failed",
            ERROR_CODES.INVALID_REQUEST,
            errors
        )
    }

    req.sessionRejectionData = {
        teacherResponse: teacherResponse?.trim() || null
    }

    next()
}


export {
    validateCreateSession,
    validateGetSessionsByStatus,
    validateSessionId,
    validateAcceptSession,
    validateRejectSession
}
