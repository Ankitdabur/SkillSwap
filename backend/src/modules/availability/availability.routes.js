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

router.get("/me" , verifyJWT , getCurrentUserAvailability )
router.put("/me" , verifyJWT , validateUpdateAvailability , updateCurrentUserAvailability)
export default router