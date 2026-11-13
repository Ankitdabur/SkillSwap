import { jest } from "@jest/globals"
import {
    validateCreateReview,
    validateGetUserReviews
} from "../../../src/modules/reviews/review.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Review Validation", () => {

    const validSessionId = "507f1f77bcf86cd799439011"
    const validUserId = "507f1f77bcf86cd799439012"
    const validCursor = "507f1f77bcf86cd799439013"

    const createValidReviewBody = (overrides = {}) => ({
        sessionId: validSessionId,
        rating: 5,
        comment: "Great Session",
        ...overrides
    })


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // CREATE REVIEW


    test("Create Review validation accepts and normalizes correct data", () => {

        const req = {
            body: createValidReviewBody({
                comment: "   Great Session   "
            })
        }

        const next = jest.fn()

        validateCreateReview(req, {}, next)

        expect(req.reviewData).toEqual({
            sessionId: validSessionId,
            rating: 5,
            comment: "Great Session"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create Review validation accepts an omitted comment", () => {

        const body = createValidReviewBody()

        delete body.comment

        const req = {body}
        const next = jest.fn()

        validateCreateReview(req, {}, next)

        expect(req.reviewData.comment).toBeNull()
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create Review validation rejects unknown field", () => {

        const req = {
            body: createValidReviewBody({
                reviewedUser: validUserId
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateReview,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "reviewedUser",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Review validation rejects missing fields", () => {

        const req = {body: {}}
        const next = jest.fn()

        const error = getValidationError(
            validateCreateReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "sessionId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "rating",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Review validation rejects invalid Session ID", () => {

        const req = {
            body: createValidReviewBody({
                sessionId: "invalid-session-id"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "sessionId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Review validation rejects invalid ratings", () => {

        for(const rating of ["5", 0, 6, 4.5]){

            const req = {
                body: createValidReviewBody({rating})
            }

            const next = jest.fn()

            const error = getValidationError(
                validateCreateReview,
                req,
                next
            )

            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: "rating",
                        code: ERROR_CODES.INVALID_FIELD_VALUE
                    })
                ])
            )
            expect(next).not.toHaveBeenCalled()

        }

    })


    test("Create Review validation rejects invalid comments", () => {

        for(const comment of ["   ", 10, "a".repeat(1001)]){

            const req = {
                body: createValidReviewBody({comment})
            }

            const next = jest.fn()

            const error = getValidationError(
                validateCreateReview,
                req,
                next
            )

            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: "comment",
                        code: ERROR_CODES.INVALID_FIELD_VALUE
                    })
                ])
            )
            expect(next).not.toHaveBeenCalled()

        }

    })


    // GET USER REVIEWS


    test("Get user Reviews validation applies default pagination", () => {

        const req = {
            params: {
                userId: validUserId
            },
            query: {}
        }

        const next = jest.fn()

        validateGetUserReviews(req, {}, next)

        expect(req.reviewPagination).toEqual({
            cursor: null,
            limit: 10
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get user Reviews validation accepts cursor pagination", () => {

        const req = {
            params: {
                userId: validUserId
            },
            query: {
                cursor: validCursor,
                limit: "20"
            }
        }

        const next = jest.fn()

        validateGetUserReviews(req, {}, next)

        expect(req.reviewPagination).toEqual({
            cursor: validCursor,
            limit: 20
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get user Reviews validation rejects invalid user ID", () => {

        const req = {
            params: {
                userId: "invalid-user-id"
            },
            query: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetUserReviews,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "userId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get user Reviews validation rejects unknown query field", () => {

        const req = {
            params: {
                userId: validUserId
            },
            query: {
                rating: "5"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetUserReviews,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "rating",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get user Reviews validation rejects invalid cursor", () => {

        const req = {
            params: {
                userId: validUserId
            },
            query: {
                cursor: "invalid-review-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetUserReviews,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "cursor",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get user Reviews validation rejects invalid limit", () => {

        const req = {
            params: {
                userId: validUserId
            },
            query: {
                limit: "101"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetUserReviews,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "limit",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })

})
