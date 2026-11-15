import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import User from "../../../src/models/user.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    ACCOUNT_STATUSES,
    NOTIFICATION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestAdmin,
    createTestLearner,
    createTestTeacher
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestNotifications,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const ADMIN_URL = `http://localhost:${PORT}/api/v1/admin`

let server


const updateAccountStatus = async (
    userId,
    action,
    accessToken,
    body = {}
) => {
    try {
        return await axios.patch(
            `${ADMIN_URL}/users/${userId}/${action}`,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestNotifications()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestNotifications()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Admin Account Status", () => {

    test("Admin can suspend an active user", async () => {
        const {user: admin} = await createTestAdmin()
        const {user} = await createTestLearner()

        await User.findByIdAndUpdate(user._id, {
            refreshTokenHash: "integration-test-refresh-token-hash"
        })

        const beforeSuspension = Date.now()
        const response = await updateAccountStatus(
            user._id,
            "suspend",
            generateAccessToken(admin._id),
            {
                days: 2
            }
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "User account suspended successfully"
        )
        expect(response.data.data.user.accountStatus).toBe(
            ACCOUNT_STATUSES.SUSPENDED
        )
        expect(new Date(
            response.data.data.user.suspendedUntil
        ).getTime()).toBeGreaterThanOrEqual(
            beforeSuspension + 2 * 24 * 60 * 60 * 1000
        )

        const suspendedUser = await User.findById(user._id)
        .select("+refreshTokenHash")
        const notification = await Notification.findOne({
            recipient: user._id,
            type: NOTIFICATION_TYPES.ACCOUNT_SUSPENDED
        })

        expect(suspendedUser.accountStatus).toBe(
            ACCOUNT_STATUSES.SUSPENDED
        )
        expect(suspendedUser.refreshTokenHash).toBeNull()
        expect(notification).not.toBeNull()
    })


    test("Admin can ban a suspended user", async () => {
        const {user: admin} = await createTestAdmin()
        const {user} = await createTestLearner()

        await User.findByIdAndUpdate(user._id, {
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            refreshTokenHash: "integration-test-refresh-token-hash"
        }, {
            runValidators: true
        })

        const response = await updateAccountStatus(
            user._id,
            "ban",
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "User account banned successfully"
        )
        expect(response.data.data.user.accountStatus).toBe(
            ACCOUNT_STATUSES.BANNED
        )
        expect(response.data.data.user.suspendedUntil).toBeNull()

        const bannedUser = await User.findById(user._id)
        .select("+refreshTokenHash")
        const notification = await Notification.findOne({
            recipient: user._id,
            type: NOTIFICATION_TYPES.ACCOUNT_BANNED
        })

        expect(bannedUser.refreshTokenHash).toBeNull()
        expect(notification).not.toBeNull()
    })


    test("Admin can reactivate a suspended user", async () => {
        const {user: admin} = await createTestAdmin()
        const {user} = await createTestLearner()

        await User.findByIdAndUpdate(user._id, {
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, {
            runValidators: true
        })

        const response = await updateAccountStatus(
            user._id,
            "reactivate",
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "User account reactivated successfully"
        )
        expect(response.data.data.user.accountStatus).toBe(
            ACCOUNT_STATUSES.ACTIVE
        )
        expect(response.data.data.user.suspendedUntil).toBeNull()

        const notification = await Notification.findOne({
            recipient: user._id,
            type: NOTIFICATION_TYPES.ACCOUNT_REACTIVATED
        })

        expect(notification).not.toBeNull()
    })


    test("Non-admin cannot change another user's account status", async () => {
        const {user} = await createTestLearner()
        const {user: targetUser} = await createTestTeacher()

        const response = await updateAccountStatus(
            targetUser._id,
            "ban",
            generateAccessToken(user._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.INSUFFICIENT_ROLE)

        const unchangedUser = await User.findById(targetUser._id)

        expect(unchangedUser.accountStatus).toBe(
            ACCOUNT_STATUSES.ACTIVE
        )
    })


    test("Admin account cannot be suspended", async () => {
        const {user: admin} = await createTestAdmin()

        const response = await updateAccountStatus(
            admin._id,
            "suspend",
            generateAccessToken(admin._id),
            {
                days: 1
            }
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
    })
})
