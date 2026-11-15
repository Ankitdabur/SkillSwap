import mongoose from "mongoose"
import { checkAccountStatus } from "../../../src/middlewares/accountStatus.middleware.js"
import {
    ACCOUNT_STATUSES,
    USER_ROLES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Account Status Middleware", () => {

    const createUser = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        role: USER_ROLES.USER,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        suspendedUntil: null,
        ...overrides
    })


    const runMiddleware = (req) => {

        return new Promise((resolve) => {
            checkAccountStatus(
                req,
                {},
                (error) => resolve(error)
            )
        })

    }


    test("Active user is allowed", async () => {

        const user = createUser()
        const req = {user}

        const error = await runMiddleware(req)

        expect(error).toBeUndefined()
        expect(req.user).toBe(user)

    })


    test("Admin is allowed regardless of account status", async () => {

        const admin = createUser({
            role: USER_ROLES.ADMIN,
            accountStatus: ACCOUNT_STATUSES.BANNED
        })
        const req = {user: admin}

        const error = await runMiddleware(req)

        expect(error).toBeUndefined()
        expect(req.user).toBe(admin)

    })


    test("Banned user is rejected", async () => {

        const req = {
            user: createUser({
                accountStatus: ACCOUNT_STATUSES.BANNED
            })
        }

        const error = await runMiddleware(req)

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe(ERROR_CODES.ACCOUNT_BANNED)

    })


    test("Suspended user is rejected", async () => {

        const req = {
            user: createUser({
                accountStatus: ACCOUNT_STATUSES.SUSPENDED,
                suspendedUntil: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                )
            })
        }

        const error = await runMiddleware(req)

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe(ERROR_CODES.ACCOUNT_SUSPENDED)

    })

})
