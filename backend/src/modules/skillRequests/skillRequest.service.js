
import mongoose from "mongoose"
import SkillRequest from "../../models/skillRequest.model.js"
import Skill from "../../models/skill.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    SKILL_REQUEST_STATUSES,
    NOTIFICATION_TYPES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"


const createSkillRequestService = async (requestedBy,skillRequestData) => {

    const {
        name,
        category,
        description
    } = skillRequestData

    const existingSkill = await Skill.findOne({name})

    if(existingSkill){
        throw new ApiError(
            409,
            "Skill already exists",
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    }

    const existingPendingRequest = await SkillRequest.findOne({
        requestedBy,
        name,
        status: SKILL_REQUEST_STATUSES.PENDING
    })

    if(existingPendingRequest){
        throw new ApiError(
            409,
            "Pending skill request already exists",
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    }

    const skillRequest = await SkillRequest.create({
        requestedBy,
        name,
        category,
        description
    })

    return {skillRequest}
}


const getMySkillRequestsByStatusService = async ( requestedBy , status ) => {

    const skillRequests = await SkillRequest.aggregate([
        {
            $match : {
                requestedBy,
                status
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        }
    ])

    return {skillRequests}
}


const getSkillRequestsByStatusService = async (status, page, limit) => {

    const skip = (page - 1) * limit

    const skillRequests = await SkillRequest.aggregate([
        {
            $match : {
                status
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $skip : skip
        },
        {
            $limit : limit
        }
    ])

    const totalRequests = await SkillRequest.countDocuments({status})

    const totalPages = Math.ceil(totalRequests / limit)

    return {
        skillRequests,
        pagination: {
            page,
            limit,
            totalRequests,
            totalPages
        }
    }
}


const approveSkillRequestService = async (
    skillRequestId,
    skillData
) => {

    const {
        name,
        displayName,
        category,
        description,
        adminResponse
    } = skillData

    const session = await mongoose.startSession()

    let createdSkill
    let approvedSkillRequest

    try {
        await session.withTransaction(async () => {

            const skillRequest = await SkillRequest.findById(skillRequestId).session(session)

            if(!skillRequest){
                throw new ApiError(
                    404,
                    "Skill request not found",
                    ERROR_CODES.RESOURCE_NOT_FOUND
                )
            }

            if(skillRequest.status !== SKILL_REQUEST_STATUSES.PENDING){
                throw new ApiError(
                    409,
                    "Skill request has already been reviewed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const existingSkill = await Skill.findOne({name}).session(session)

            if(existingSkill){
                throw new ApiError(
                    409,
                    "Skill already exists",
                    ERROR_CODES.RESOURCE_ALREADY_EXISTS
                )
            }

            const skills = await Skill.create(
                [
                    {
                        name,
                        displayName,
                        category,
                        description
                    }
                ],
                {
                    session
                }
            )

            createdSkill = skills[0]

            skillRequest.status = SKILL_REQUEST_STATUSES.APPROVED
            skillRequest.adminResponse = adminResponse ?? null

            approvedSkillRequest = await skillRequest.save({session})

            await createNotificationService(
                {
                    recipient: skillRequest.requestedBy,
                    type: NOTIFICATION_TYPES.SKILL_REQUEST_APPROVED,
                    message: `Admin approved your Skill request for ${skillRequest.name}`
                },
                session
            )
        })
    } catch (error) {
        throw error
    } finally {
        await session.endSession()
    }

    return {
        skill: createdSkill,
        skillRequest: approvedSkillRequest
    }
}


const rejectSkillRequestService = async (
    skillRequestId,
    adminResponse
) => {

    const session = await mongoose.startSession()

    let rejectedSkillRequest

    try {
        await session.withTransaction(async () => {

            rejectedSkillRequest = await SkillRequest.findOneAndUpdate(
                {
                    _id: skillRequestId,
                    status: SKILL_REQUEST_STATUSES.PENDING
                },
                {
                    status: SKILL_REQUEST_STATUSES.REJECTED,
                    adminResponse
                },
                {
                    new : true,
                    runValidators: true,
                    session
                }
            )

            if(!rejectedSkillRequest){
                const existingSkillRequest = await SkillRequest.findById(
                    skillRequestId
                ).session(session)

                if(!existingSkillRequest){
                    throw new ApiError(
                        404,
                        "Skill request not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                throw new ApiError(
                    409,
                    "Skill request has already been reviewed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            await createNotificationService(
                {
                    recipient: rejectedSkillRequest.requestedBy,
                    type: NOTIFICATION_TYPES.SKILL_REQUEST_REJECTED,
                    message: `Admin rejected your Skill request for ${rejectedSkillRequest.name}`
                },
                session
            )
        })
    } finally {
        await session.endSession()
    }

    return {skillRequest: rejectedSkillRequest}
}


export {
    createSkillRequestService,
    getMySkillRequestsByStatusService,
    getSkillRequestsByStatusService,
    approveSkillRequestService,
    rejectSkillRequestService
}
