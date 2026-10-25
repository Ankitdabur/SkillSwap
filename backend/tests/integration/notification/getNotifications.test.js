import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
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


const getNotifications = async (
    path,
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${NOTIFICATIONS_URL}${path}${query}`,
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


describe("Get Notifications", () => {

    test("User can get their notifications with pagination", async () => {
        const {user} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
            "First notification"
        )

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED,
            "Second notification"
        )

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_REJECTED,
            "Third notification"
        )

        await createTestNotification(
            otherUser._id,
            NOTIFICATION_TYPES.MATCH_REMOVED,
            "Other user notification"
        )

        const response = await getNotifications(
            "",
            accessToken,
            "?page=2&limit=1"
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Notifications fetched successfully"
        )
        expect(response.data.data.notifications).toHaveLength(1)
        expect(
            response.data.data.notifications[0].recipient
        ).toBe(user._id.toString())
        expect(response.data.data.pagination).toEqual({
            page: 2,
            limit: 1,
            totalNotifications: 3,
            totalPages: 3
        })
    })


    test("User can get only read notifications", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const readNotification = await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED,
            "Read notification",
            true
        )

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
            "Unread notification"
        )

        const response = await getNotifications(
            "/read",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.notifications).toHaveLength(1)
        expect(response.data.data.notifications[0]._id).toBe(
            readNotification._id.toString()
        )
        expect(response.data.data.notifications[0].isRead).toBe(true)
        expect(response.data.data.pagination.totalNotifications).toBe(1)
        expect(response.data.data.pagination.limit).toBe(20)
    })


    test("User can get only unread notifications", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const unreadNotification = await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
            "Unread notification"
        )

        await createTestNotification(
            user._id,
            NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED,
            "Read notification",
            true
        )

        const response = await getNotifications(
            "/unread",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.notifications).toHaveLength(1)
        expect(response.data.data.notifications[0]._id).toBe(
            unreadNotification._id.toString()
        )
        expect(response.data.data.notifications[0].isRead).toBe(false)
        expect(response.data.data.pagination.totalNotifications).toBe(1)
    })


    test("User can get their unread notification count", async () => {
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
            "Read notification",
            true
        )
        await createTestNotification(otherUser._id)

        const response = await getNotifications(
            "/unread-count",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.unreadCount).toBe(2)
    })


    test("User cannot get notifications without access token", async () => {
        const response = await getNotifications("")

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
