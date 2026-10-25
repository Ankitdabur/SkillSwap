import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
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
const CONVERSATIONS_URL = `http://localhost:${PORT}/api/v1/messages/conversations`

let server


const getChatHistoryUsers = async (accessToken) => {
    try {
        return await axios.get(
            CONVERSATIONS_URL,
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


describe("Get Chat History Users", () => {

    test("User can get all users with whom they have chat history", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: firstUser} = await createTestTeacher()
        const {user: secondUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        await createTestMessage(
            firstUser._id,
            loggedInUser._id,
            "Unread message from first user"
        )

        await createTestMessage(
            loggedInUser._id,
            firstUser._id,
            "Latest message with first user"
        )

        await createTestMessage(
            secondUser._id,
            loggedInUser._id,
            "Latest conversation message"
        )

        await createTestMessage(
            firstUser._id,
            secondUser._id,
            "Unrelated conversation"
        )

        const response = await getChatHistoryUsers(accessToken)

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Chat history users fetched successfully"
        )
        expect(response.data.data.conversations).toHaveLength(2)

        const conversations = response.data.data.conversations

        expect(conversations[0].user._id).toBe(
            secondUser._id.toString()
        )
        expect(conversations[0].user.username).toBe(
            secondUser.username
        )
        expect(conversations[0].user.fullname).toBe(
            secondUser.fullname
        )
        expect(conversations[0].lastMessage).toEqual({
            content: "Latest conversation message"
        })
        expect(conversations[0].unreadCount).toBe(1)

        const firstConversation = conversations.find(
            (conversation) =>
                conversation.user._id === firstUser._id.toString()
        )

        expect(firstConversation).toBeDefined()
        expect(firstConversation.lastMessage).toEqual({
            content: "Latest message with first user"
        })
        expect(firstConversation.unreadCount).toBe(1)
    })


    test("Deleted last Message is returned as deleted text", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(loggedInUser._id)

        await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Original deleted content",
            false,
            true
        )

        const response = await getChatHistoryUsers(accessToken)

        expect(response.status).toBe(200)
        expect(
            response.data.data.conversations[0].lastMessage
        ).toEqual({
            content: "Message is deleted"
        })
    })


    test("User without chat history receives an empty list", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await getChatHistoryUsers(accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.conversations).toEqual([])
    })


    test("User cannot get chat history users without access token", async () => {
        const response = await getChatHistoryUsers()

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
