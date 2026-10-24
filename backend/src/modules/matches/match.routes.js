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


router.post("/", verifyJWT, validateSendMatchRequest, sendMatchRequest)
router.get("/pending/incoming", verifyJWT, getIncomingPendingMatches)
router.get("/pending/outgoing", verifyJWT, getOutgoingPendingMatches)
router.get("/accepted", verifyJWT, getAcceptedMatches)
router.get("/blocked", verifyJWT, getBlockedMatches)
router.put("/block/:userId", verifyJWT, validateMatchUserId, blockUser)
router.delete("/block/:userId", verifyJWT, validateMatchUserId, unblockUser)
router.patch("/:matchId/accept", verifyJWT, validateMatchId, acceptMatch)
router.delete("/:matchId/reject", verifyJWT, validateMatchId, rejectMatch)
router.delete("/:matchId/cancel", verifyJWT, validateMatchId, cancelMatch)
router.delete("/:matchId/remove", verifyJWT, validateMatchId, removeMatch)


export default router
