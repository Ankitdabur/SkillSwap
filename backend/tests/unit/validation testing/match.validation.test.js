import { jest } from "@jest/globals"
import {
    validateSendMatchRequest,
    validateMatchId,
    validateMatchUserId
} from "../../../src/modules/matches/match.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Match Validation", () => {

    const loggedInUserId = "507f1f77bcf86cd799439011"
    const otherUserId = "507f1f77bcf86cd799439012"
    const matchId = "507f1f77bcf86cd799439013"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // SEND MATCH REQUEST


    test("Send Match request validation accepts correct data", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId
            }
        }

        const next = jest.fn()

        validateSendMatchRequest(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Send Match request validation rejects unknown field", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                status: "ACCEPTED"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
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


    test("Send Match request validation rejects missing receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Match request validation rejects missing body", () => {

        const req = {
            user: {
                _id: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Match request validation rejects invalid receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: "invalid-user-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Match request validation rejects non-string receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Match request validation rejects self request", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMatchRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // MATCH ID


    test("Match id validation accepts valid Match id", () => {

        const req = {
            params: {
                matchId
            }
        }

        const next = jest.fn()

        validateMatchId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Match id validation rejects missing Match id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Match id validation rejects invalid Match id", () => {

        const req = {
            params: {
                matchId: "invalid-match-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Match id validation rejects non-string Match id", () => {

        const req = {
            params: {
                matchId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // MATCH USER ID


    test("Match user id validation accepts valid user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: otherUserId
            }
        }

        const next = jest.fn()

        validateMatchUserId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Match user id validation rejects missing user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Match user id validation rejects invalid user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: "invalid-user-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Match user id validation rejects non-string user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Match user id validation rejects logged-in user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMatchUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })

})
