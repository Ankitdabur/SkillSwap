import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import { learningAccountMiddleware } from "../../middlewares/accountType.middleware.js"
import { validateTeacherDiscovery } from "./discovery.validation.js"
import {discoverTeachers} from "./discovery.controller.js"

const router = Router()


// Discover compatible teachers for a requested Skill
router.get(
    "/teachers",
    verifyJWT,
    checkAccountStatus,
    learningAccountMiddleware,
    validateTeacherDiscovery,
    discoverTeachers
)


export default router
