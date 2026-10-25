import {Router} from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import {
    getCurrentUserAvailability,
    updateCurrentUserAvailability
} from "./availability.controller.js"
import {
    validateUpdateAvailability
} from "./availability.validation.js"

const router = Router()

// Get the current user's availability
router.get("/me" , verifyJWT , getCurrentUserAvailability )
// Replace the current user's availability
router.put("/me" , verifyJWT , validateUpdateAvailability , updateCurrentUserAvailability)
export default router
