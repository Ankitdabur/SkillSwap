import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { NOTIFICATION_TYPES } from "../../../src/constants/enums.js"
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


const markAllNotificationsAsRead = async (accessToken) => {
    try {
        return await axios.patch(
            `${NOTIFICATIONS_URL}/read-all`,
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


describe("Mark All Notifications As Read", () => {

    test("User can mark all their unread notifications as read", async () => {
        const {user} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        await createTestNotification(user._id)
        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED
        )
        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REMOVED,
            "Already read notification",
            true
        )
        const otherNotification = await createTestNotification(
            otherUser._id
        )

        const response = await markAllNotificationsAsRead(accessToken)

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "All notifications marked as read successfully"
        )
        expect(response.data.data.modifiedCount).toBe(2)

        const userNotifications = await Notification.find({
            recipient: user._id
        })

        expect(
            userNotifications.every(
                (notification) => notification.isRead
            )
        ).toBe(true)

        const savedOtherNotification = await Notification.findById(
            otherNotification._id
        )

        expect(savedOtherNotification.isRead).toBe(false)
    })


    test("Mark all returns zero when user has no unread notifications", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED,
            "Already read notification",
            true
        )

        const response = await markAllNotificationsAsRead(accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.modifiedCount).toBe(0)
    })


    test("User cannot mark all notifications as read without access token", async () => {
        const response = await markAllNotificationsAsRead()

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
