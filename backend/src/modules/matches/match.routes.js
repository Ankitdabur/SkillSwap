import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import {
    validateSendMatchRequest,
    validateMatchId,
    validateMatchUserId
} from "./match.validation.js"
import {
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
} from "./match.controller.js"


const router = Router()


// Send a Match request to another user
router.post("/", verifyJWT, validateSendMatchRequest, sendMatchRequest)
// Get incoming pending Match requests
router.get("/pending/incoming", verifyJWT, getIncomingPendingMatches)
// Get outgoing pending Match requests
router.get("/pending/outgoing", verifyJWT, getOutgoingPendingMatches)
// Get all accepted Matches
router.get("/accepted", verifyJWT, getAcceptedMatches)
// Get all blocked users
router.get("/blocked", verifyJWT, getBlockedMatches)
// Block another user
router.put("/block/:userId", verifyJWT, validateMatchUserId, blockUser)
// Unblock a blocked user
router.delete("/block/:userId", verifyJWT, validateMatchUserId, unblockUser)
// Accept an incoming Match request
router.patch("/:matchId/accept", verifyJWT, validateMatchId, acceptMatch)
// Reject an incoming Match request
router.delete("/:matchId/reject", verifyJWT, validateMatchId, rejectMatch)
// Cancel an outgoing Match request
router.delete("/:matchId/cancel", verifyJWT, validateMatchId, cancelMatch)
// Remove an accepted Match
router.delete("/:matchId/remove", verifyJWT, validateMatchId, removeMatch)


export default router
