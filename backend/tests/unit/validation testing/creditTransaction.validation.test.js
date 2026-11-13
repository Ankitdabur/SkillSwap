import { jest } from "@jest/globals"
import { validateGetCreditTransactions } from "../../../src/modules/creditTransactions/creditTransaction.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("CreditTransaction Validation", () => {

    const creditTransactionId = "507f1f77bcf86cd799439011"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    test("Get CreditTransactions validation applies default pagination", () => {

        const req = {}
        const next = jest.fn()

        validateGetCreditTransactions(req, {}, next)

        expect(req.creditTransactionPagination).toEqual({
            cursor: null,
            limit: 10
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get CreditTransactions validation accepts cursor pagination", () => {

        const req = {
            query: {
                cursor: creditTransactionId,
                limit: "25"
            }
        }
        const next = jest.fn()

        validateGetCreditTransactions(req, {}, next)

        expect(req.creditTransactionPagination).toEqual({
            cursor: creditTransactionId,
            limit: 25
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get CreditTransactions validation accepts maximum limit", () => {

        const req = {
            query: {
                limit: "100"
            }
        }
        const next = jest.fn()

        validateGetCreditTransactions(req, {}, next)

        expect(req.creditTransactionPagination.limit).toBe(100)
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get CreditTransactions validation rejects unknown query field", () => {

        const req = {
            query: {
                status: "PENDING"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
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


    test("Get CreditTransactions validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-credit-transaction-id"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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


    test("Get CreditTransactions validation rejects non-string cursor", () => {

        const req = {
            query: {
                cursor: 123
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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


    test("Get CreditTransactions validation rejects zero limit", () => {

        const req = {
            query: {
                limit: "0"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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


    test("Get CreditTransactions validation rejects negative limit", () => {

        const req = {
            query: {
                limit: "-1"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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


    test("Get CreditTransactions validation rejects limit above maximum", () => {

        const req = {
            query: {
                limit: "101"
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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


    test("Get CreditTransactions validation rejects non-string limit", () => {

        const req = {
            query: {
                limit: 10
            }
        }
        const next = jest.fn()

        const error = getValidationError(
            validateGetCreditTransactions,
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
