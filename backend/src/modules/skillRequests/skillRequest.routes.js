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


router.post("/",verifyJWT, validateCreateSkillRequest,createSkillRequest)
router.get("/me/pending", verifyJWT, getMyPendingSkillRequests)
router.get("/me/approved", verifyJWT, getMyApprovedSkillRequests)
router.get("/me/rejected", verifyJWT, getMyRejectedSkillRequests)
//pagination
router.get("/admin/pending", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getPendingSkillRequests)
router.get("/admin/approved", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getApprovedSkillRequests)
router.get("/admin/rejected", verifyJWT, adminRoleMiddleware, validateGetSkillRequests, getRejectedSkillRequests)

router.patch("/admin/:skillRequestId/approve", verifyJWT, adminRoleMiddleware, validateSkillRequestId, validateApproveSkillRequest, approveSkillRequest)
router.patch("/admin/:skillRequestId/reject", verifyJWT, adminRoleMiddleware, validateSkillRequestId, validateRejectSkillRequest, rejectSkillRequest)




export default router
