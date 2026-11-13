import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js"
import {
    validateCreateReview,
    validateGetUserReviews
} from "./review.validation.js"
import {
    createReview,
    getUserReviews
} from "./review.controller.js"


const router = Router()


// Create a Review for a completed regular Session
router.post("/", verifyJWT, checkAccountStatus, validateCreateReview, createReview)
// Get Reviews received by a user with cursor pagination
router.get("/user/:userId", verifyJWT, checkAccountStatus, validateGetUserReviews, getUserReviews)


export default router
