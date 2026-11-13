import mongoose from "mongoose"
import Review from "../../../src/models/review.model.js"


describe("Review Model", () => {

    const createReviewData = (overrides = {}) => ({
        session: new mongoose.Types.ObjectId(),
        reviewer: new mongoose.Types.ObjectId(),
        reviewedUser: new mongoose.Types.ObjectId(),
        rating: 5,
        comment: "Great Session",
        ...overrides
    })


    const getValidationError = async (review) => {

        try {
            await review.validate()
            return null
        } catch (error) {
            return error
        }

    }


    const hasFieldError = (error, field) => {

        return Object.keys(error.errors).some(
            (key) => key === field
        )

    }


    // VALID REVIEW


    test("Valid Review passes validation", async () => {

        const review = new Review(createReviewData())

        await expect(review.validate()).resolves.toBeUndefined()

    })


    // SESSION


    test("Session is required", async () => {

        const data = createReviewData()

        delete data.session

        const error = await getValidationError(new Review(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "session")).toBe(true)

    })


    test("Session references the Session model and is immutable", () => {

        const sessionPath = Review.schema.path("session")

        expect(sessionPath.options.ref).toBe("Session")
        expect(sessionPath.options.immutable).toBe(true)

    })


    test("Invalid Session id is rejected", async () => {

        const review = new Review(
            createReviewData({
                session: "invalid-session-id"
            })
        )

        const error = await getValidationError(review)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "session")).toBe(true)

    })


    // REVIEWER


    test("Reviewer is required", async () => {

        const data = createReviewData()

        delete data.reviewer

        const error = await getValidationError(new Review(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reviewer")).toBe(true)

    })


    test("Reviewer references the User model and is immutable", () => {

        const reviewerPath = Review.schema.path("reviewer")

        expect(reviewerPath.options.ref).toBe("User")
        expect(reviewerPath.options.immutable).toBe(true)

    })


    test("Invalid reviewer id is rejected", async () => {

        const review = new Review(
            createReviewData({
                reviewer: "invalid-user-id"
            })
        )

        const error = await getValidationError(review)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reviewer")).toBe(true)

    })


    // REVIEWED USER


    test("Reviewed user is required", async () => {

        const data = createReviewData()

        delete data.reviewedUser

        const error = await getValidationError(new Review(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reviewedUser")).toBe(true)

    })


    test("Reviewed user references the User model and is immutable", () => {

        const reviewedUserPath = Review.schema.path("reviewedUser")

        expect(reviewedUserPath.options.ref).toBe("User")
        expect(reviewedUserPath.options.immutable).toBe(true)

    })


    test("Invalid reviewed user id is rejected", async () => {

        const review = new Review(
            createReviewData({
                reviewedUser: "invalid-user-id"
            })
        )

        const error = await getValidationError(review)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reviewedUser")).toBe(true)

    })


    test("Reviewer and reviewed user must be different users", async () => {

        const userId = new mongoose.Types.ObjectId()

        const review = new Review(
            createReviewData({
                reviewer: userId,
                reviewedUser: userId
            })
        )

        const error = await getValidationError(review)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reviewedUser")).toBe(true)
        expect(error.errors.reviewedUser.message).toBe(
            "Reviewer and reviewed user must be different users"
        )

    })


    // RATING


    test("Rating is required", async () => {

        const data = createReviewData()

        delete data.rating

        const error = await getValidationError(new Review(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    test("Whole-number ratings from 1 to 5 are accepted", async () => {

        for(const rating of [1, 2, 3, 4, 5]){

            const review = new Review(
                createReviewData({rating})
            )

            await expect(review.validate()).resolves.toBeUndefined()

        }

    })


    test("Rating below 1 is rejected", async () => {

        const error = await getValidationError(
            new Review(createReviewData({rating: 0}))
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    test("Rating above 5 is rejected", async () => {

        const error = await getValidationError(
            new Review(createReviewData({rating: 6}))
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    test("Fractional rating is rejected", async () => {

        const error = await getValidationError(
            new Review(createReviewData({rating: 4.5}))
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    test("Rating is immutable", () => {

        const ratingPath = Review.schema.path("rating")

        expect(ratingPath.options.immutable).toBe(true)

    })


    // COMMENT


    test("Comment is optional and defaults to null", async () => {

        const data = createReviewData()

        delete data.comment

        const review = new Review(data)

        await expect(review.validate()).resolves.toBeUndefined()
        expect(review.comment).toBeNull()

    })


    test("Comment is trimmed", () => {

        const review = new Review(
            createReviewData({
                comment: "   Great Session   "
            })
        )

        expect(review.comment).toBe("Great Session")

    })


    test("Comment longer than 1000 characters is rejected", async () => {

        const error = await getValidationError(
            new Review(
                createReviewData({
                    comment: "a".repeat(1001)
                })
            )
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "comment")).toBe(true)

    })


    test("Comment is immutable", () => {

        const commentPath = Review.schema.path("comment")

        expect(commentPath.options.immutable).toBe(true)

    })


    // INDEXES


    test("Review has a unique Session and reviewer index", () => {

        const indexes = Review.schema.indexes()

        const reviewIndex = indexes.find(
            ([fields]) =>
                fields.session === 1 &&
                fields.reviewer === 1
        )

        expect(reviewIndex).toBeDefined()
        expect(reviewIndex[1].unique).toBe(true)

    })


    test("Review has reviewed user cursor pagination index", () => {

        const indexes = Review.schema.indexes()

        const reviewedUserIndex = indexes.find(
            ([fields]) =>
                fields.reviewedUser === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(reviewedUserIndex).toBeDefined()

    })


    // TIMESTAMPS


    test("Review schema has timestamps enabled", () => {

        expect(Review.schema.options.timestamps).toBe(true)

    })

})
