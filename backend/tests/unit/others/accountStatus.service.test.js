import { jest } from "@jest/globals"
import mongoose from "mongoose"
import User from "../../../src/models/user.model.js"
import Notification from "../../../src/models/notification.model.js"
import {
    checkUserAccountStatus,
    formatSuspensionExpiry
} from "../../../src/modules/users/accountStatus.service.js"
import {
    ACCOUNT_STATUSES,
    NOTIFICATION_TYPES,
    USER_ROLES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Account Status Service", () => {

    const createUser = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        role: USER_ROLES.USER,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        suspendedUntil: null,
        ...overrides
    })


    afterEach(() => {
        jest.restoreAllMocks()
    })


    test("Active user is allowed", async () => {

        const user = createUser()

        await expect(
            checkUserAccountStatus(user)
        ).resolves.toBe(user)

    })


    test("Admin is allowed regardless of account status", async () => {

        const admin = createUser({
            role: USER_ROLES.ADMIN,
            accountStatus: ACCOUNT_STATUSES.BANNED
        })

        await expect(
            checkUserAccountStatus(admin)
        ).resolves.toBe(admin)

    })


    test("Banned user is rejected", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.BANNED
        })

        await expect(
            checkUserAccountStatus(user)
        ).rejects.toMatchObject({
            statusCode: 403,
            code: ERROR_CODES.ACCOUNT_BANNED
        })

    })


    test("User with active suspension is rejected", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(
                Date.now() + 24 * 60 * 60 * 1000
            )
        })

        await expect(
            checkUserAccountStatus(user)
        ).rejects.toMatchObject({
            statusCode: 403,
            code: ERROR_CODES.ACCOUNT_SUSPENDED
        })

    })


    test("Suspended user without expiry is rejected", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.SUSPENDED
        })

        await expect(
            checkUserAccountStatus(user)
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Your account is temporarily suspended",
            code: ERROR_CODES.ACCOUNT_SUSPENDED
        })

    })


    test("Suspension expiry is formatted in Indian timezone", () => {

        const formattedExpiry = formatSuspensionExpiry(
            new Date("2026-01-01T00:00:00.000Z")
        )

        expect(formattedExpiry).toContain("2026")
        expect(formattedExpiry).toContain("5:30")

    })


    test("Expired suspension reactivates user and creates notification", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(
                Date.now() - 24 * 60 * 60 * 1000
            )
        })

        const reactivatedUser = createUser({
            _id: user._id
        })

        const databaseSession = {
            withTransaction: jest.fn(async (callback) => callback()),
            endSession: jest.fn()
        }

        jest.spyOn(
            mongoose,
            "startSession"
        ).mockResolvedValue(databaseSession)

        jest.spyOn(
            User,
            "findOneAndUpdate"
        ).mockResolvedValue(reactivatedUser)

        jest.spyOn(
            Notification,
            "create"
        ).mockResolvedValue([
            {
                recipient: user._id,
                type: NOTIFICATION_TYPES.ACCOUNT_REACTIVATED
            }
        ])

        const result = await checkUserAccountStatus(user)

        expect(result).toBe(reactivatedUser)
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: user._id,
                accountStatus: ACCOUNT_STATUSES.SUSPENDED
            }),
            {
                accountStatus: ACCOUNT_STATUSES.ACTIVE,
                suspendedUntil: null
            },
            expect.objectContaining({
                new: true,
                runValidators: true,
                session: databaseSession
            })
        )
        expect(Notification.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    recipient: user._id,
                    type: NOTIFICATION_TYPES.ACCOUNT_REACTIVATED
                })
            ],
            {
                session: databaseSession
            }
        )
        expect(databaseSession.endSession).toHaveBeenCalledTimes(1)

    })


    test("Expired suspension refetches account when another request changed it", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(
                Date.now() - 24 * 60 * 60 * 1000
            )
        })

        const currentUser = createUser({
            _id: user._id
        })

        const databaseSession = {
            withTransaction: jest.fn(async (callback) => callback()),
            endSession: jest.fn()
        }

        jest.spyOn(
            mongoose,
            "startSession"
        ).mockResolvedValue(databaseSession)

        jest.spyOn(
            User,
            "findOneAndUpdate"
        ).mockResolvedValue(null)

        jest.spyOn(
            User,
            "findById"
        ).mockResolvedValue(currentUser)

        const result = await checkUserAccountStatus(user)

        expect(result).toBe(currentUser)
        expect(User.findById).toHaveBeenCalledWith(user._id)
        expect(databaseSession.endSession).toHaveBeenCalledTimes(1)

    })


    test("Expired suspension rejects when user no longer exists", async () => {

        const user = createUser({
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(
                Date.now() - 24 * 60 * 60 * 1000
            )
        })

        const databaseSession = {
            withTransaction: jest.fn(async (callback) => callback()),
            endSession: jest.fn()
        }

        jest.spyOn(
            mongoose,
            "startSession"
        ).mockResolvedValue(databaseSession)

        jest.spyOn(
            User,
            "findOneAndUpdate"
        ).mockResolvedValue(null)

        jest.spyOn(
            User,
            "findById"
        ).mockResolvedValue(null)

        await expect(
            checkUserAccountStatus(user)
        ).rejects.toMatchObject({
            statusCode: 401,
            code: ERROR_CODES.INVALID_ACCESS_TOKEN
        })

        expect(databaseSession.endSession).toHaveBeenCalledTimes(1)

    })

})
