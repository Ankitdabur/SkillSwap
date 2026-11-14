import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    getUnderReviewSessionsService,
    getUnderReviewSessionByIdService,
    resolveSessionReviewService,
    suspendUserService,
    banUserService,
    reactivateUserService,
    getReportsByStatusService,
    getReportByIdService,
    resolveReportService,
    dismissReportService
} from "./admin.service.js"


const getUnderReviewSessions = asyncHandler(async (req, res) => {

    const {
        cursor,
        limit
    } = req.adminSessionPagination

    const sessionsData = await getUnderReviewSessionsService(
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionsData,
            "Under-review Sessions fetched successfully"
        )
    )
})


const getUnderReviewSessionById = asyncHandler(async (req, res) => {

    const sessionData = await getUnderReviewSessionByIdService(
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Under-review Session fetched successfully"
        )
    )
})


const resolveSessionReview = asyncHandler(async (req, res) => {

    const sessionData = await resolveSessionReviewService(
        req.params.sessionId,
        req.adminSessionResolutionData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session review resolved successfully"
        )
    )
})


const suspendUser = asyncHandler(async (req, res) => {

    const userData = await suspendUserService(
        req.params.userId,
        req.accountSuspensionData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userData,
            "User account suspended successfully"
        )
    )
})


const banUser = asyncHandler(async (req, res) => {

    const userData = await banUserService(req.params.userId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userData,
            "User account banned successfully"
        )
    )
})


const reactivateUser = asyncHandler(async (req, res) => {

    const userData = await reactivateUserService(req.params.userId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userData,
            "User account reactivated successfully"
        )
    )
})


const getReportsByStatus = asyncHandler(async (req, res) => {

    const {
        status,
        cursor,
        limit
    } = req.adminReportQuery

    const reportsData = await getReportsByStatusService(
        status,
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reportsData,
            "Reports fetched successfully"
        )
    )
})


const getReportById = asyncHandler(async (req, res) => {

    const reportData = await getReportByIdService(req.params.reportId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reportData,
            "Report fetched successfully"
        )
    )
})


const resolveReport = asyncHandler(async (req, res) => {

    const reportData = await resolveReportService(
        req.params.reportId,
        req.reportDecisionData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reportData,
            "Report resolved successfully"
        )
    )
})


const dismissReport = asyncHandler(async (req, res) => {

    const reportData = await dismissReportService(
        req.params.reportId,
        req.reportDecisionData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reportData,
            "Report dismissed successfully"
        )
    )
})


export {
    getUnderReviewSessions,
    getUnderReviewSessionById,
    resolveSessionReview,
    suspendUser,
    banUser,
    reactivateUser,
    getReportsByStatus,
    getReportById,
    resolveReport,
    dismissReport
}
