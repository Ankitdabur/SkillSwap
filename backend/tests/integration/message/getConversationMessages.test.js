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
const MESSAGES_URL = `http://localhost:${PORT}/api/v1/messages`

let server


const getConversationMessages = async (
    userId,
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${MESSAGES_URL}/with/${userId}${query}`,
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


describe("Get Conversation Messages", () => {

    test("User can get only their Messages with another user", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const firstMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "First message"
        )

        const secondMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Second message"
        )

        await createTestMessage(
            otherUser._id,
            unrelatedUser._id,
            "Unrelated message"
        )

        const response = await getConversationMessages(
            otherUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Conversation messages fetched successfully"
        )
        expect(response.data.data.messages).toHaveLength(2)
        expect(
            response.data.data.messages.map((message) => message._id)
        ).toEqual([
            secondMessage._id.toString(),
            firstMessage._id.toString()
        ])
        expect(
            response.data.data.messages[0].conversationKey
        ).toBeUndefined()
        expect(response.data.data.pagination).toEqual({
            limit: 20,
            direction: "older",
            nextCursor: null,
            hasMore: false
        })
    })


    test("User can get older Messages using cursor pagination", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(loggedInUser._id)

        const firstMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "First message"
        )

        const secondMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Second message"
        )

        const thirdMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "Third message"
        )

        const fourthMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Fourth message"
        )

        const firstResponse = await getConversationMessages(
            otherUser._id.toString(),
            accessToken,
            "?limit=2"
        )

        expect(
            firstResponse.data.data.messages.map(
                (message) => message._id
            )
        ).toEqual([
            fourthMessage._id.toString(),
            thirdMessage._id.toString()
        ])
        expect(firstResponse.data.data.pagination.hasMore).toBe(true)
        expect(firstResponse.data.data.pagination.nextCursor).toBe(
            thirdMessage._id.toString()
        )

        const secondResponse = await getConversationMessages(
            otherUser._id.toString(),
            accessToken,
            `?cursor=${thirdMessage._id}&direction=older&limit=2`
        )

        expect(secondResponse.status).toBe(200)
        expect(
            secondResponse.data.data.messages.map(
                (message) => message._id
            )
        ).toEqual([
            secondMessage._id.toString(),
            firstMessage._id.toString()
        ])
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 2,
            direction: "older",
            nextCursor: null,
            hasMore: false
        })
    })


    test("User can get newer Messages using cursor pagination", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(loggedInUser._id)

        const firstMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "First message"
        )

        const secondMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Second message"
        )

        const thirdMessage = await createTestMessage(
            loggedInUser._id,
            otherUser._id,
            "Third message"
        )

        const fourthMessage = await createTestMessage(
            otherUser._id,
            loggedInUser._id,
            "Fourth message"
        )

        const firstResponse = await getConversationMessages(
            otherUser._id.toString(),
            accessToken,
            `?cursor=${firstMessage._id}&direction=newer&limit=2`
        )

        expect(firstResponse.status).toBe(200)
        expect(
            firstResponse.data.data.messages.map(
                (message) => message._id
            )
        ).toEqual([
            thirdMessage._id.toString(),
            secondMessage._id.toString()
        ])
        expect(firstResponse.data.data.pagination.hasMore).toBe(true)
        expect(firstResponse.data.data.pagination.nextCursor).toBe(
            thirdMessage._id.toString()
        )

        const secondResponse = await getConversationMessages(
            otherUser._id.toString(),
            accessToken,
            `?cursor=${thirdMessage._id}&direction=newer&limit=2`
        )

        expect(secondResponse.status).toBe(200)
        expect(
            secondResponse.data.data.messages.map(
                (message) => message._id
            )
        ).toEqual([
            fourthMessage._id.toString()
        ])
        expect(secondResponse.data.data.pagination.hasMore).toBe(false)
    })


    test("Deleted Message content is hidden in conversation history", async () => {
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

        const response = await getConversationMessages(
            otherUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.messages[0].content).toBe(
            "Message is deleted"
        )
    })


    test("Cursor from another conversation is rejected", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const unrelatedMessage = await createTestMessage(
            otherUser._id,
            unrelatedUser._id,
            "Unrelated message"
        )

        const response = await getConversationMessages(
            otherUser._id.toString(),
            accessToken,
            `?cursor=${unrelatedMessage._id}`
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("Getting conversation with missing user returns not found", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const accessToken = generateAccessToken(loggedInUser._id)
        const missingUserId = new mongoose.Types.ObjectId()

        const response = await getConversationMessages(
            missingUserId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
    })


    test("User cannot get conversation Messages without access token", async () => {
        const response = await getConversationMessages(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
