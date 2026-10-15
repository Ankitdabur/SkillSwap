import { jest } from "@jest/globals"
import { requireAccountTypes } from "../../src/middlewares/accountType.middleware.js"
import { ACCOUNT_TYPES } from "../../src/constants/enums.js"
import { ERROR_CODES } from "../../src/constants/errorCodes.js"


describe("Account Type Middleware", () => {

    test("LEARNER account is allowed when LEARNER account is required", () => {

        const req = {
            user: {
                accountType: ACCOUNT_TYPES.LEARNER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.LEARNER
        )

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("TEACHER account is allowed when TEACHER account is required", () => {

        const req = {
            user: {
                accountType: ACCOUNT_TYPES.TEACHER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.TEACHER
        )

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("TEACHER_LEARNER account is allowed when TEACHER_LEARNER account is required", () => {

        const req = {
            user: {
                accountType: ACCOUNT_TYPES.TEACHER_LEARNER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.TEACHER_LEARNER
        )

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Account type is allowed when it is included in multiple allowed account types", () => {

        const req = {
            user: {
                accountType: ACCOUNT_TYPES.TEACHER_LEARNER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.TEACHER,
            ACCOUNT_TYPES.TEACHER_LEARNER
        )

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Account type middleware rejects request when user is missing", () => {

        const req = {}
        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.LEARNER
        )

        let error

        try {
            middleware(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_REQUIRED)
        expect(next).not.toHaveBeenCalled()

    })


    test("LEARNER account is rejected when teaching account is required", () => {

        const req = {
            user: {
                accountType: ACCOUNT_TYPES.LEARNER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireAccountTypes(
            ACCOUNT_TYPES.TEACHER,
            ACCOUNT_TYPES.TEACHER_LEARNER
        )

        let error

        try {
            middleware(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe(ERROR_CODES.ACCOUNT_TYPE_NOT_PERMITTED)
        expect(next).not.toHaveBeenCalled()

    })

})
