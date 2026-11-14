import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import {
    validateCreateReport,
    validateGetMyReports
} from "./report.validation.js"
import {
    createReport,
    getMyReports
} from "./report.controller.js"


const router = Router()


// Report another Session participant or Message participant
router.post("/", verifyJWT, checkAccountStatus, validateCreateReport, createReport)
// Get Reports created by the logged-in user with cursor pagination
router.get("/me", verifyJWT, checkAccountStatus, validateGetMyReports, getMyReports)


export default router
