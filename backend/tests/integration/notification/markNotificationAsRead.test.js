import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestNotification
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestNotifications,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const NOTIFICATIONS_URL = `http://localhost:${PORT}/api/v1/notifications`

let server


const markNotificationAsRead = async (
    notificationId,
    accessToken
) => {
    try {
        return await axios.patch(
            `${NOTIFICATIONS_URL}/${notificationId}/read`,
            {},
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


describe("Mark Notification As Read", () => {

    test("User can mark their unread notification as read", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const notification = await createTestNotification(user._id)

        const response = await markNotificationAsRead(
            notification._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Notification marked as read successfully"
        )
        expect(response.data.data.notification.isRead).toBe(true)

        const savedNotification = await Notification.findById(
            notification._id
        )

        expect(savedNotification.isRead).toBe(true)
    })


    test("Marking an already read notification remains successful", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const notification = await createTestNotification(
            user._id,
            undefined,
            undefined,
            true
        )

        const response = await markNotificationAsRead(
            notification._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.notification.isRead).toBe(true)
    })


    test("User cannot mark another user's notification as read", async () => {
        const {user} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)
        const notification = await createTestNotification(
            otherUser._id
        )

        const response = await markNotificationAsRead(
            notification._id.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )

        const savedNotification = await Notification.findById(
            notification._id
        )

        expect(savedNotification.isRead).toBe(false)
    })


    test("User receives not found error for missing notification", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const missingNotificationId = new mongoose.Types.ObjectId()

        const response = await markNotificationAsRead(
            missingNotificationId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("User receives validation error for invalid notification id", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await markNotificationAsRead(
            "invalid-notification-id",
            accessToken
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("User cannot mark notification as read without access token", async () => {
        const response = await markNotificationAsRead(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
