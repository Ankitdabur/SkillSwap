import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Message from "../../../src/models/message.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestMessage
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMessages,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MESSAGES_URL = `http://localhost:${PORT}/api/v1/messages`

let server


const markMessagesAsRead = async (userId, accessToken) => {
    try {
        return await axios.patch(
            `${MESSAGES_URL}/with/${userId}/read`,
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
    await cleanupTestMessages()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestMessages()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Mark Conversation Messages As Read", () => {

    test("User can mark unread received Messages as read", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const firstUnreadMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "First unread Message"
        )

        const secondUnreadMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Second unread Message"
        )

        const alreadyReadMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Already read Message",
            true
        )

        const outgoingMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "Outgoing Message"
        )

        const unrelatedMessage = await createTestMessage(
            unrelatedUser._id,
            otherUser._id,
            "Unrelated Message"
        )

        const response = await markMessagesAsRead(
            otherUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Conversation messages marked as read successfully"
        )
        expect(response.data.data.modifiedCount).toBe(2)

        const savedMessages = await Message.find({
            _id: {
                $in: [
                    firstUnreadMessage._id,
                    secondUnreadMessage._id,
                    alreadyReadMessage._id,
                    outgoingMessage._id,
                    unrelatedMessage._id
                ]
            }
        })

        const messagesById = new Map(
            savedMessages.map((message) => [
                message._id.toString(),
                message
            ])
        )

        expect(
            messagesById.get(firstUnreadMessage._id.toString()).isRead
        ).toBe(true)
        expect(
            messagesById.get(secondUnreadMessage._id.toString()).isRead
        ).toBe(true)
        expect(
            messagesById.get(alreadyReadMessage._id.toString()).isRead
        ).toBe(true)
        expect(
            messagesById.get(outgoingMessage._id.toString()).isRead
        ).toBe(false)
        expect(
            messagesById.get(unrelatedMessage._id.toString()).isRead
        ).toBe(false)
    })


    test("Mark read returns zero when there are no unread received Messages", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(loggedInUser._id)

        await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Already read Message",
            true
        )

        const response = await markMessagesAsRead(
            otherUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.modifiedCount).toBe(0)
    })


    test("Marking Messages from missing user returns not found", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const accessToken = generateAccessToken(loggedInUser._id)
        const missingUserId = new mongoose.Types.ObjectId()

        const response = await markMessagesAsRead(
            missingUserId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
    })


    test("User cannot mark Messages as read without access token", async () => {
        const response = await markMessagesAsRead(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
