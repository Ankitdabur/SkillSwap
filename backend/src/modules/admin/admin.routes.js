import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import { adminRoleMiddleware } from "../../middlewares/role.middleware.js"
import { validateSessionId } from "../sessions/session.validation.js"
import {
    validateGetUnderReviewSessions,
    validateResolveSessionReview
} from "./admin.validation.js"
import {
    getUnderReviewSessions,
    getUnderReviewSessionById,
    resolveSessionReview
} from "./admin.controller.js"


const router = Router()


router.use(verifyJWT, checkAccountStatus, adminRoleMiddleware)

// Get under-review Sessions with cursor pagination
router.get("/sessions/under-review" , validateGetUnderReviewSessions , getUnderReviewSessions)
// Get one under-review Session with participant and Skill details
router.get("/sessions/under-review/:sessionId", validateSessionId, getUnderReviewSessionById)
// Resolve an under-review Session as completed or cancelled
router.patch("/sessions/under-review/:sessionId/resolve", validateSessionId, validateResolveSessionReview, resolveSessionReview)


export default router
