import { jest } from "@jest/globals"
import {
    validateCreateReport,
    validateGetMyReports
} from "../../../src/modules/reports/report.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Report Validation", () => {

    const validSessionId = "507f1f77bcf86cd799439011"
    const validMessageId = "507f1f77bcf86cd799439012"
    const validCursor = "507f1f77bcf86cd799439013"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // CREATE REPORT


    test("Create Report validation accepts Session Report", () => {

        const req = {
            body: {
                sessionId: validSessionId,
                reason: "   Inappropriate Session behavior   "
            }
        }
        const next = jest.fn()

        validateCreateReport(req, {}, next)

        expect(req.reportData).toEqual({
            sessionId: validSessionId,
            messageId: null,
            reason: "Inappropriate Session behavior"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create Report validation accepts Message Report", () => {

        const req = {
            body: {
                messageId: validMessageId,
                reason: "Inappropriate Message"
            }
        }
        const next = jest.fn()

        validateCreateReport(req, {}, next)

        expect(req.reportData).toEqual({
            sessionId: null,
            messageId: validMessageId,
            reason: "Inappropriate Message"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create Report validation requires exactly one reference", () => {

        for(const body of [
            {
                reason: "Missing reference"
            },
            {
                sessionId: validSessionId,
                messageId: validMessageId,
                reason: "Too many references"
            }
        ]){

            const req = {body}
            const next = jest.fn()

            const error = getValidationError(
                validateCreateReport,
                req,
                next
            )

            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: "reference",
                        code: ERROR_CODES.INVALID_REQUEST
                    })
                ])
            )
            expect(next).not.toHaveBeenCalled()

        }

    })


    test("Create Report validation rejects invalid reference IDs", () => {

        for(const [field, otherField] of [
            ["sessionId", "messageId"],
            ["messageId", "sessionId"]
        ]){

            const req = {
                body: {
                    [field]: "invalid-id",
                    reason: "Invalid reference"
                }
            }
            const next = jest.fn()

            const error = getValidationError(
                validateCreateReport,
                req,
                next
            )

            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field,
                        code: ERROR_CODES.INVALID_FIELD_VALUE
                    })
                ])
            )
            expect(req.body[otherField]).toBeUndefined()
            expect(next).not.toHaveBeenCalled()

        }

    })


    test("Create Report validation rejects missing reason", () => {

        const req = {
            body: {
                sessionId: validSessionId
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateCreateReport,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "reason",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Report validation rejects invalid reasons", () => {

        for(const reason of ["   ", 123, "a".repeat(1001)]){

            const req = {
                body: {
                    sessionId: validSessionId,
                    reason
                }
            }
            const next = jest.fn()

            const error = getValidationError(
                validateCreateReport,
                req,
                next
            )

            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: "reason",
                        code: ERROR_CODES.INVALID_FIELD_VALUE
                    })
                ])
            )
            expect(next).not.toHaveBeenCalled()

        }

    })


    test("Create Report validation rejects unknown field", () => {

        const req = {
            body: {
                sessionId: validSessionId,
                reason: "Valid reason",
                reportedUser: validMessageId
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateCreateReport,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "reportedUser",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // GET MY REPORTS


    test("Get my Reports validation applies default pagination", () => {

        const req = {query: {}}
        const next = jest.fn()

        validateGetMyReports(req, {}, next)

        expect(req.reportPagination).toEqual({
            cursor: null,
            limit: 10
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get my Reports validation accepts cursor pagination", () => {

        const req = {
            query: {
                cursor: validCursor,
                limit: "25"
            }
        }
        const next = jest.fn()

        validateGetMyReports(req, {}, next)

        expect(req.reportPagination).toEqual({
            cursor: validCursor,
            limit: 25
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get my Reports validation rejects unknown query field", () => {

        const req = {
            query: {
                status: "PENDING"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetMyReports,
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


    test("Get my Reports validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-report-id"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetMyReports,
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


    test("Get my Reports validation rejects invalid limits", () => {

        for(const limit of ["0", "101", "invalid", 10]){

            const req = {
                query: {limit}
            }
            const next = jest.fn()

            const error = getValidationError(
                validateGetMyReports,
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

})
