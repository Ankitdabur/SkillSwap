import { jest } from "@jest/globals"
import { requireRoles } from "../../../src/middlewares/role.middleware.js"
import { USER_ROLES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Role Middleware", () => {

    test("USER role is allowed when USER role is required", () => {

        const req = {
            user: {
                role: USER_ROLES.USER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireRoles(USER_ROLES.USER)

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("ADMIN role is allowed when ADMIN role is required", () => {

        const req = {
            user: {
                role: USER_ROLES.ADMIN
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireRoles(USER_ROLES.ADMIN)

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Role is allowed when it is included in multiple allowed roles", () => {

        const req = {
            user: {
                role: USER_ROLES.ADMIN
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireRoles(
            USER_ROLES.USER,
            USER_ROLES.ADMIN
        )

        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Role middleware rejects request when user is missing", () => {

        const req = {}
        const res = {}
        const next = jest.fn()

        const middleware = requireRoles(USER_ROLES.USER)

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


    test("USER role is rejected when ADMIN role is required", () => {

        const req = {
            user: {
                role: USER_ROLES.USER
            }
        }

        const res = {}
        const next = jest.fn()

        const middleware = requireRoles(USER_ROLES.ADMIN)

        let error

        try {
            middleware(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_ROLE)
        expect(next).not.toHaveBeenCalled()

    })

})
