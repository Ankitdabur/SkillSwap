import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    createSessionService,
    getTeachingSessionsService,
    getLearningSessionsService,
    getSessionByIdService,
    acceptSessionService,
    rejectConflictingSessionsService,
    rejectSessionService,
    cancelSessionService,
    confirmSessionCompletionService,
    reportSessionDidNotHappenService,
    disputeSessionService,
    unsendSessionService,
    getConflictingSessionsService
} from "./session.service.js"


const createSession = asyncHandler(async (req, res) => {

    const sessionData = await createSessionService(
        req.user._id,
        req.sessionData
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            sessionData,
            "Session request sent successfully"
        )
    )
})


const getTeachingSessions = asyncHandler(async (req, res) => {

    const sessionsData = await getTeachingSessionsService(
        req.user._id,
        req.sessionListQuery
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionsData,
            "Teaching Sessions fetched successfully"
        )
    )
})


const getLearningSessions = asyncHandler(async (req, res) => {

    const sessionsData = await getLearningSessionsService(
        req.user._id,
        req.sessionListQuery
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionsData,
            "Learning Sessions fetched successfully"
        )
    )
})


const getSessionById = asyncHandler(async (req, res) => {

    const sessionData = await getSessionByIdService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session fetched successfully"
        )
    )
})


const acceptSession = asyncHandler(async (req, res) => {

    const sessionData = await acceptSessionService(
        req.user._id,
        req.params.sessionId,
        req.sessionAcceptanceData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session accepted successfully"
        )
    )
})


const rejectConflictingSessions = asyncHandler(async (req, res) => {

    const rejectionData = await rejectConflictingSessionsService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            rejectionData,
            "Conflicting pending Sessions handled successfully"
        )
    )
})


const rejectSession = asyncHandler(async (req, res) => {

    const sessionData = await rejectSessionService(
        req.user._id,
        req.params.sessionId,
        req.sessionRejectionData
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session rejected successfully"
        )
    )
})


const cancelSession = asyncHandler(async (req, res) => {

    const sessionData = await cancelSessionService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session cancelled successfully"
        )
    )
})


const confirmSessionCompletion = asyncHandler(async (req, res) => {

    const sessionData = await confirmSessionCompletionService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session completion confirmed successfully"
        )
    )
})


const reportSessionDidNotHappen = asyncHandler(async (req, res) => {

    const sessionData = await reportSessionDidNotHappenService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session marked as not happened successfully"
        )
    )
})


const disputeSession = asyncHandler(async (req, res) => {

    const sessionData = await disputeSessionService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session disputed successfully"
        )
    )
})


const unsendSession = asyncHandler(async (req, res) => {

    const sessionData = await unsendSessionService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionData,
            "Session request unsent successfully"
        )
    )
})


const getConflictingSessions = asyncHandler(async (req, res) => {

    const sessionsData = await getConflictingSessionsService(
        req.user._id,
        req.params.sessionId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            sessionsData,
            "Conflicting Sessions fetched successfully"
        )
    )
})


export {
    createSession,
    getTeachingSessions,
    getLearningSessions,
    getSessionById,
    acceptSession,
    rejectConflictingSessions,
    rejectSession,
    cancelSession,
    confirmSessionCompletion,
    reportSessionDidNotHappen,
    disputeSession,
    unsendSession,
    getConflictingSessions
}
