import { jest } from "@jest/globals"
import {
    validateGetUnderReviewSessions,
    validateResolveSessionReview,
    validateSuspendUser,
    validateAccountStatusAction,
    validateGetReportsByStatus,
    validateReportId,
    validateReportDecision
} from "../../../src/modules/admin/admin.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    REPORT_STATUSES,
    SESSION_STATUSES
} from "../../../src/constants/enums.js"


describe("Admin Validation", () => {

    const sessionId = "507f1f77bcf86cd799439011"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // GET UNDER-REVIEW SESSIONS


    test("Get under-review Sessions validation applies default pagination", () => {

        const req = {}
        const next = jest.fn()

        validateGetUnderReviewSessions(req, {}, next)

        expect(req.adminSessionPagination).toEqual({
            cursor: null,
            limit: 10
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get under-review Sessions validation accepts cursor pagination", () => {

        const req = {
            query: {
                cursor: sessionId,
                limit: "25"
            }
        }
        const next = jest.fn()

        validateGetUnderReviewSessions(req, {}, next)

        expect(req.adminSessionPagination).toEqual({
            cursor: sessionId,
            limit: 25
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get under-review Sessions validation accepts maximum limit", () => {

        const req = {
            query: {
                limit: "100"
            }
        }
        const next = jest.fn()

        validateGetUnderReviewSessions(req, {}, next)

        expect(req.adminSessionPagination.limit).toBe(100)
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get under-review Sessions validation rejects unknown field", () => {

        const req = {
            query: {
                status: "UNDER_REVIEW"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetUnderReviewSessions,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get under-review Sessions validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-session-id"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetUnderReviewSessions,
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


    test("Get under-review Sessions validation rejects invalid limit", () => {

        for(const limit of ["0", "101", "invalid"]){
            const req = {
                query: {limit}
            }
            const next = jest.fn()

            const error = getValidationError(
                validateGetUnderReviewSessions,
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
        }

    })


    // RESOLVE SESSION REVIEW


    test("Resolve Session review validation accepts completed resolution", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.COMPLETED
            }
        }
        const next = jest.fn()

        validateResolveSessionReview(req, {}, next)

        expect(req.adminSessionResolutionData).toEqual({
            resolution: SESSION_STATUSES.COMPLETED,
            adminResponse: null
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Resolve Session review validation accepts cancelled resolution", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.CANCELLED,
                adminResponse: "   Evidence reviewed by admin   "
            }
        }
        const next = jest.fn()

        validateResolveSessionReview(req, {}, next)

        expect(req.adminSessionResolutionData).toEqual({
            resolution: SESSION_STATUSES.CANCELLED,
            adminResponse: "Evidence reviewed by admin"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Resolve Session review validation rejects missing resolution", () => {

        const req = {
            body: {}
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "resolution",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Resolve Session review validation rejects invalid resolution", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.UNDER_REVIEW
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "resolution",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Resolve Session review validation rejects empty admin response", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.COMPLETED,
                adminResponse: "   "
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Resolve Session review validation rejects long admin response", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.CANCELLED,
                adminResponse: "a".repeat(501)
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Resolve Session review validation rejects non-string admin response", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.COMPLETED,
                adminResponse: 123
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Resolve Session review validation rejects unknown field", () => {

        const req = {
            body: {
                resolution: SESSION_STATUSES.COMPLETED,
                status: SESSION_STATUSES.COMPLETED
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateResolveSessionReview,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // ACCOUNT STATUS ACTIONS


    test("Suspend user validation accepts positive whole days", () => {

        const req = {
            params: {userId: sessionId},
            body: {days: 7}
        }
        const next = jest.fn()

        validateSuspendUser(req, {}, next)

        expect(req.accountSuspensionData).toEqual({days: 7})
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Suspend user validation rejects invalid user ID and days", () => {

        const req = {
            params: {userId: "invalid-user-id"},
            body: {days: 0}
        }
        const next = jest.fn()

        const error = getValidationError(
            validateSuspendUser,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "userId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "days",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account status action validation accepts user ID with empty body", () => {

        const req = {
            params: {userId: sessionId},
            body: {}
        }
        const next = jest.fn()

        validateAccountStatusAction(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Account status action validation rejects request body fields", () => {

        const req = {
            params: {userId: sessionId},
            body: {status: "BANNED"}
        }
        const next = jest.fn()

        const error = getValidationError(
            validateAccountStatusAction,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // ADMIN REPORTS


    test("Get Reports by status validation normalizes status and pagination", () => {

        const req = {
            params: {status: "pending"},
            query: {
                cursor: sessionId,
                limit: "20"
            }
        }
        const next = jest.fn()

        validateGetReportsByStatus(req, {}, next)

        expect(req.adminReportQuery).toEqual({
            status: REPORT_STATUSES.PENDING,
            cursor: sessionId,
            limit: 20
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get Reports by status validation rejects invalid status", () => {

        const req = {
            params: {status: "closed"},
            query: {}
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetReportsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Report ID validation accepts valid Report ID", () => {

        const req = {
            params: {reportId: sessionId}
        }
        const next = jest.fn()

        validateReportId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Report ID validation rejects invalid Report ID", () => {

        const req = {
            params: {reportId: "invalid-report-id"}
        }
        const next = jest.fn()

        const error = getValidationError(
            validateReportId,
            req,
            next
        )

        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Report decision validation accepts and trims optional response", () => {

        const req = {
            body: {
                adminResponse: "   Evidence reviewed   "
            }
        }
        const next = jest.fn()

        validateReportDecision(req, {}, next)

        expect(req.reportDecisionData).toEqual({
            adminResponse: "Evidence reviewed"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Report decision validation accepts missing response as null", () => {

        const req = {body: {}}
        const next = jest.fn()

        validateReportDecision(req, {}, next)

        expect(req.reportDecisionData).toEqual({
            adminResponse: null
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Report decision validation rejects empty response", () => {

        const req = {
            body: {
                adminResponse: "   "
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateReportDecision,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })

})
