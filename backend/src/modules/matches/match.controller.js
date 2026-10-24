import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    sendMatchRequestService,
    getIncomingPendingMatchesService,
    getOutgoingPendingMatchesService,
    getAcceptedMatchesService,
    getBlockedMatchesService,
    acceptMatchService,
    rejectMatchService,
    cancelMatchService,
    removeMatchService,
    blockUserService,
    unblockUserService
} from "./match.service.js"


const sendMatchRequest = asyncHandler(async (req, res) => {

    const matchData = await sendMatchRequestService(req.user._id , req.body.receiverId)

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            matchData,
            "Match request sent successfully"
        )
    )
})


const getIncomingPendingMatches = asyncHandler(async (req, res) => {

    const pendingMatches = await getIncomingPendingMatchesService(req.user._id)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            pendingMatches,
            "Incoming pending Match requests fetched successfully"
        )
    )
})


const getOutgoingPendingMatches = asyncHandler(async (req, res) => {

    const pendingMatches = await getOutgoingPendingMatchesService(req.user._id)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            pendingMatches,
            "Outgoing pending Match requests fetched successfully"
        )
    )
})


const getAcceptedMatches = asyncHandler(async (req, res) => {

    const matchesData = await getAcceptedMatchesService(
        req.user._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchesData,
            "Accepted Matches fetched successfully"
        )
    )
})


const getBlockedMatches = asyncHandler(async (req, res) => {

    const matchesData = await getBlockedMatchesService(
        req.user._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchesData,
            "Blocked Matches fetched successfully"
        )
    )
})


const acceptMatch = asyncHandler(async (req, res) => {

    const {matchId} = req.params

    const matchData = await acceptMatchService(
        req.user._id,
        matchId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "Match request accepted successfully"
        )
    )
})


const rejectMatch = asyncHandler(async (req, res) => {

    const {matchId} = req.params

    const matchData = await rejectMatchService(
        req.user._id,
        matchId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "Match request rejected successfully"
        )
    )
})


const cancelMatch = asyncHandler(async (req, res) => {

    const {matchId} = req.params

    const matchData = await cancelMatchService(
        req.user._id,
        matchId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "Match request cancelled successfully"
        )
    )
})


const removeMatch = asyncHandler(async (req, res) => {

    const {matchId} = req.params

    const matchData = await removeMatchService(
        req.user._id,
        matchId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "Match removed successfully"
        )
    )
})


const blockUser = asyncHandler(async (req, res) => {

    const {userId} = req.params

    const matchData = await blockUserService(
        req.user._id,
        userId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "User blocked successfully"
        )
    )
})


const unblockUser = asyncHandler(async (req, res) => {

    const {userId} = req.params

    const matchData = await unblockUserService(
        req.user._id,
        userId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            matchData,
            "User unblocked successfully"
        )
    )
})


export {
    sendMatchRequest,
    getIncomingPendingMatches,
    getOutgoingPendingMatches,
    getAcceptedMatches,
    getBlockedMatches,
    acceptMatch,
    rejectMatch,
    cancelMatch,
    removeMatch,
    blockUser,
    unblockUser
}
