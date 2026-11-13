import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    createReviewService,
    getUserReviewsService
} from "./review.service.js"


const createReview = asyncHandler(async (req, res) => {

    const reviewData = await createReviewService(
        req.user._id,
        req.reviewData
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            reviewData,
            "Review created successfully"
        )
    )
})


const getUserReviews = asyncHandler(async (req, res) => {

    const reviewsData = await getUserReviewsService(
        req.params.userId,
        req.reviewPagination.cursor,
        req.reviewPagination.limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reviewsData,
            "Reviews fetched successfully"
        )
    )
})


export {
    createReview,
    getUserReviews
}
