
import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import { SKILL_REQUEST_STATUSES } from "../../constants/enums.js"
import {
    createSkillRequestService,
    getMySkillRequestsByStatusService,
    getSkillRequestsByStatusService,
    approveSkillRequestService,
    rejectSkillRequestService
} from "./skillRequest.service.js"


const createSkillRequest = asyncHandler(async (req, res) => {

    const skillRequestData = await createSkillRequestService(
        req.user._id,
        req.body
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            skillRequestData,
            "Skill request created successfully"
        )
    )
})


const getMyPendingSkillRequests = asyncHandler(async (req, res) => {

    const skillRequestsData = await getMySkillRequestsByStatusService(
        req.user._id,
        SKILL_REQUEST_STATUSES.PENDING
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Pending skill requests fetched successfully"
        )
    )
})


const getMyApprovedSkillRequests = asyncHandler(async (req, res) => {

    const skillRequestsData = await getMySkillRequestsByStatusService ( req.user._id , SKILL_REQUEST_STATUSES.APPROVED)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Approved skill requests fetched successfully"
        )
    )
})


const getMyRejectedSkillRequests = asyncHandler(async (req, res) => {

    const skillRequestsData = await getMySkillRequestsByStatusService(
        req.user._id,
        SKILL_REQUEST_STATUSES.REJECTED
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Rejected skill requests fetched successfully"
        )
    )
})


const getPendingSkillRequests = asyncHandler(async (req, res) => {

    const {
        page,
        limit
    } = req.pagination

    const skillRequestsData = await getSkillRequestsByStatusService(
        SKILL_REQUEST_STATUSES.PENDING,
        page,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Pending skill requests fetched successfully"
        )
    )
})


const getApprovedSkillRequests = asyncHandler(async (req, res) => {

    const {
        page,
        limit
    } = req.pagination

    const skillRequestsData = await getSkillRequestsByStatusService(
        SKILL_REQUEST_STATUSES.APPROVED,
        page,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Approved skill requests fetched successfully"
        )
    )
})


const getRejectedSkillRequests = asyncHandler(async (req, res) => {

    const {
        page,
        limit
    } = req.pagination

    const skillRequestsData = await getSkillRequestsByStatusService(
        SKILL_REQUEST_STATUSES.REJECTED,
        page,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillRequestsData,
            "Rejected skill requests fetched successfully"
        )
    )
})


const approveSkillRequest = asyncHandler(async (req, res) => {

    const {skillRequestId} = req.params

    const approvedSkillRequestData = await approveSkillRequestService(
        skillRequestId,
        req.body
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            approvedSkillRequestData,
            "Skill request approved successfully"
        )
    )
})


const rejectSkillRequest = asyncHandler(async (req, res) => {

    const {skillRequestId} = req.params

    const rejectedSkillRequestData = await rejectSkillRequestService(skillRequestId,req.body.adminResponse)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            rejectedSkillRequestData,
            "Skill request rejected successfully"
        )
    )
})


export {
    createSkillRequest,
    getMyPendingSkillRequests,
    getMyApprovedSkillRequests,
    getMyRejectedSkillRequests,
    getPendingSkillRequests,
    getApprovedSkillRequests,
    getRejectedSkillRequests,
    approveSkillRequest,
    rejectSkillRequest
}
