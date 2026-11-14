import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import { adminRoleMiddleware } from "../../middlewares/role.middleware.js"
import { validateSessionId } from "../sessions/session.validation.js"
import {
    validateGetUnderReviewSessions,
    validateResolveSessionReview,
    validateSuspendUser,
    validateAccountStatusAction,
    validateGetReportsByStatus,
    validateReportId,
    validateReportDecision
} from "./admin.validation.js"
import {
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
} from "./admin.controller.js"


const router = Router()


router.use(verifyJWT, checkAccountStatus, adminRoleMiddleware)

// Get under-review Sessions with cursor pagination
router.get("/sessions/under-review" , validateGetUnderReviewSessions , getUnderReviewSessions)
// Get one under-review Session with participant and Skill details
router.get("/sessions/under-review/:sessionId", validateSessionId, getUnderReviewSessionById)
// Resolve an under-review Session as completed or cancelled
router.patch("/sessions/under-review/:sessionId/resolve", validateSessionId, validateResolveSessionReview, resolveSessionReview)
// Suspend an active user account
router.patch("/users/:userId/suspend", validateSuspendUser, suspendUser)
// Permanently ban an active or suspended user account
router.patch("/users/:userId/ban", validateAccountStatusAction, banUser)
// Reactivate a suspended user account early
router.patch("/users/:userId/reactivate", validateAccountStatusAction, reactivateUser)
// Get Reports by status with cursor pagination
router.get("/reports/status/:status", validateGetReportsByStatus, getReportsByStatus)
// Get one Report with user and referenced evidence details
router.get("/reports/:reportId", validateReportId, getReportById)
// Resolve a pending Report without applying an account action
router.patch("/reports/:reportId/resolve", validateReportId, validateReportDecision, resolveReport)
// Dismiss a pending Report without applying an account action
router.patch("/reports/:reportId/dismiss", validateReportId, validateReportDecision, dismissReport)


export default router
