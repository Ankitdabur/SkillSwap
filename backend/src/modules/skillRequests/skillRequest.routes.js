import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { adminRoleMiddleware } from "../../middlewares/role.middleware.js"
import {
    validateCreateSkillRequest,
    validateGetSkillRequests,
    validateSkillRequestId,
    validateApproveSkillRequest,
    validateRejectSkillRequest
} from "./skillRequest.validation.js"
import {
    createSkillRequest,
    getMyPendingSkillRequests,
    getMyApprovedSkillRequests,
    getMyRejectedSkillRequests,
    getPendingSkillRequests,
    getApprovedSkillRequests,
    getRejectedSkillRequests,
    approveSkillRequest,
    rejectSkillRequest
} from "./skillRequest.controller.js"


const router = Router()


// Submit a new Skill request
router.post("/",verifyJWT, validateCreateSkillRequest,createSkillRequest)
// Get the current user's pending Skill requests
router.get("/me/pending", verifyJWT, getMyPendingSkillRequests)
// Get the current user's approved Skill requests
router.get("/me/approved", verifyJWT, getMyApprovedSkillRequests)
// Get the current user's rejected Skill requests
router.get("/me/rejected", verifyJWT, getMyRejectedSkillRequests)
//pagination
// Get pending Skill requests for admin review
router.get("/admin/pending", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getPendingSkillRequests)
// Get approved Skill requests for admins
router.get("/admin/approved", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getApprovedSkillRequests)
// Get rejected Skill requests for admins
router.get("/admin/rejected", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getRejectedSkillRequests)

// Approve a pending Skill request
router.patch("/admin/:skillRequestId/approve", verifyJWT, adminRoleMiddleware, validateSkillRequestId, validateApproveSkillRequest, approveSkillRequest)
// Reject a pending Skill request
router.patch("/admin/:skillRequestId/reject", verifyJWT, adminRoleMiddleware, validateSkillRequestId, validateRejectSkillRequest, rejectSkillRequest)




export default router
