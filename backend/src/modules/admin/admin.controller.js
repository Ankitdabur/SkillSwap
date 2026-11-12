import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    getUnderReviewSessionsService,
    getUnderReviewSessionByIdService,
    resolveSessionReviewService
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


export {
    getUnderReviewSessions,
    getUnderReviewSessionById,
    resolveSessionReview
}
