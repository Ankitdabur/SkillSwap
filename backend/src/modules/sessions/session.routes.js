import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import {
    learningAccountMiddleware,
    teachingAccountMiddleware
} from "../../middlewares/accountType.middleware.js"
import {
    validateCreateSession,
    validateGetSessionsByStatus,
    validateSessionId,
    validateAcceptSession,
    validateRejectSession
} from "./session.validation.js"
import {
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
} from "./session.controller.js"


const router = Router()



// Create a Session request
router.post( "/", verifyJWT , checkAccountStatus , learningAccountMiddleware , validateCreateSession , createSession)
// Get the logged-in user's teaching Sessions by status
router.get("/me/teaching/:status", verifyJWT, checkAccountStatus, teachingAccountMiddleware, validateGetSessionsByStatus, getTeachingSessions)
// Get the logged-in user's learning Sessions by status
router.get("/me/learning/:status", verifyJWT, checkAccountStatus, learningAccountMiddleware, validateGetSessionsByStatus, getLearningSessions)
// Accept a pending Session as its assigned teacher
router.patch("/:sessionId/accept", verifyJWT, checkAccountStatus, teachingAccountMiddleware, validateSessionId, validateAcceptSession, acceptSession)
// Reject a pending Session as its assigned teacher
router.patch("/:sessionId/reject", verifyJWT, checkAccountStatus, teachingAccountMiddleware, validateSessionId, validateRejectSession, rejectSession)
// Reject teaching conflicts and delete learning conflicts
router.patch("/:sessionId/reject-conflicts", verifyJWT, checkAccountStatus, validateSessionId, rejectConflictingSessions)
// Cancel an accepted Session before it starts
router.patch("/:sessionId/cancel", verifyJWT, checkAccountStatus, validateSessionId, cancelSession)
// Confirm Session completion as its teacher or learner
router.patch("/:sessionId/confirm-completion", verifyJWT, checkAccountStatus, validateSessionId, confirmSessionCompletion)
// Report that a Session did not happen as its teacher or learner
router.patch("/:sessionId/did-not-happen", verifyJWT, checkAccountStatus, validateSessionId, reportSessionDidNotHappen)
// Dispute a Session as its learner
router.patch("/:sessionId/dispute", verifyJWT, checkAccountStatus, learningAccountMiddleware, validateSessionId, disputeSession)
// Unsend and delete a pending Session request as its learner
router.delete("/:sessionId/unsend", verifyJWT, checkAccountStatus, learningAccountMiddleware, validateSessionId, unsendSession)
// Get the logged-in participant's pending and accepted conflicts
router.get("/:sessionId/conflicts", verifyJWT, checkAccountStatus, validateSessionId, getConflictingSessions)
// Get one Session as its teacher or learner
router.get("/:sessionId", verifyJWT, checkAccountStatus, validateSessionId, getSessionById)


export default router
