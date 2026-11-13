import mongoose from "mongoose"
import Review from "../../models/review.model.js"
import Session from "../../models/session.model.js"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../constants/enums.js"


const createReviewService = async (loggedInUser, reviewData) => {

    const {
        sessionId,
        rating,
        comment
    } = reviewData

    const databaseSession = await mongoose.startSession()

    let createdReview

    try{
        await databaseSession.withTransaction(async () => {

            const existingSession = await Session.findById(sessionId)
            .select("teacher learner status sessionType")
            .session(databaseSession)

            if(!existingSession){
                throw new ApiError(
                    404,
                    "Session not found",
                    ERROR_CODES.RESOURCE_NOT_FOUND
                )
            }

            if(
                existingSession.status !== SESSION_STATUSES.COMPLETED ||
                existingSession.sessionType !== SESSION_TYPES.REGULAR
            ){
                throw new ApiError(
                    409,
                    "Only completed regular Sessions can be reviewed",
                    ERROR_CODES.INVALID_REQUEST
                )
            }

            const reviewerIsTeacher = existingSession.teacher.equals(loggedInUser)
            const reviewerIsLearner = existingSession.learner.equals(loggedInUser)

            if(!reviewerIsTeacher && !reviewerIsLearner){
                throw new ApiError(
                    403,
                    "Only Session participants can submit a Review",
                    ERROR_CODES.FORBIDDEN
                )
            }

            const existingReview = await Review.exists({
                session: existingSession._id,
                reviewer: loggedInUser
            }).session(databaseSession)

            if(existingReview){
                throw new ApiError(
                    409,
                    "You have already reviewed this Session",
                    ERROR_CODES.RESOURCE_ALREADY_EXISTS
                )
            }

            const reviewedUserId = reviewerIsTeacher
                ? existingSession.learner
                : existingSession.teacher

            const reviewedUser = await User.findById(reviewedUserId)
            .select("rating totalReviews")
            .session(databaseSession)

            if(!reviewedUser){
                throw new ApiError(
                    404,
                    "Reviewed user not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }

            const reviews = await Review.create(
                [
                    {
                        session: existingSession._id,
                        reviewer: loggedInUser,
                        reviewedUser: reviewedUser._id,
                        rating,
                        comment
                    }
                ],
                {
                    session: databaseSession
                }
            )

            createdReview = reviews[0]

            const totalReviews = reviewedUser.totalReviews + 1

            reviewedUser.rating = Number((
                (
                    reviewedUser.rating * reviewedUser.totalReviews +
                    rating
                ) / totalReviews
            ).toFixed(2))
            reviewedUser.totalReviews = totalReviews

            await reviewedUser.save({
                session: databaseSession
            })
        })
    }catch(error){
        if(error?.code === 11000){
            throw new ApiError(
                409,
                "You have already reviewed this Session",
                ERROR_CODES.RESOURCE_ALREADY_EXISTS
            )
        }

        throw error
    }finally{
        await databaseSession.endSession()
    }

    return {review: createdReview}
}


const getUserReviewsService = async (
    userId,
    cursor,
    limit
) => {

    const reviewedUserExists = await User.exists({
        _id: userId
    })

    if(!reviewedUserExists){
        throw new ApiError(
            404,
            "User not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    let cursorReview = null

    if(cursor){
        cursorReview = await Review.findOne({
            _id: cursor,
            reviewedUser: userId
        }).select("createdAt")

        if(!cursorReview){
            throw new ApiError(
                400,
                "Invalid Review cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const reviewedUserId = new mongoose.Types.ObjectId(userId)

    const reviewResults = await Review.aggregate([
        {
            $match: {
                reviewedUser: reviewedUserId,
                ...(cursorReview
                    ? {
                        $or: [
                            {
                                createdAt: {
                                    $lt: cursorReview.createdAt
                                }
                            },
                            {
                                createdAt: cursorReview.createdAt,
                                _id: {
                                    $lt: cursorReview._id
                                }
                            }
                        ]
                    }
                    : {})
            }
        },
        {
            $sort: {
                createdAt: -1,
                _id: -1
            }
        },
        {
            $limit: limit + 1
        },
        {
            $lookup: {
                from: "users",
                localField: "reviewer",
                foreignField: "_id",
                as: "reviewer"
            }
        },
        {
            $unwind: {
                path: "$reviewer",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                rating: 1,
                comment: 1,
                createdAt: 1,
                reviewer: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        }
    ])

    const hasMore = reviewResults.length > limit

    const reviews = hasMore
        ? reviewResults.slice(0, limit)
        : reviewResults

    const nextCursor = hasMore
        ? reviews[reviews.length - 1]._id.toString()
        : null

    return {
        reviews,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


export {
    createReviewService,
    getUserReviewsService
}
