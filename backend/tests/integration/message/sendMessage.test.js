import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Message from "../../../src/models/message.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    MATCH_STATUSES,
    MESSAGE_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestMatch
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMessages,
    cleanupTestMatches,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MESSAGES_URL = `http://localhost:${PORT}/api/v1/messages`

let server


const sendMessage = async (
    receiverId,
    content,
    accessToken
) => {
    try {
        return await axios.post(
            MESSAGES_URL,
            {
                receiverId,
                content
            },
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
    await cleanupTestMatches()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestMessages()
    await cleanupTestMatches()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Send Message", () => {

    test("Accepted Match participant can send a Message", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await sendMessage(
            receiver._id.toString(),
            "   Test message   ",
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Message sent successfully"
        )
        expect(response.data.data.message.sender).toBe(
            sender._id.toString()
        )
        expect(response.data.data.message.receiver).toBe(
            receiver._id.toString()
        )
        expect(response.data.data.message.content).toBe(
            "Test message"
        )
        expect(response.data.data.message.messageType).toBe(
            MESSAGE_TYPES.TEXT
        )
        expect(response.data.data.message.isRead).toBe(false)
        expect(response.data.data.message.isDeleted).toBe(false)
        expect(
            response.data.data.message.conversationKey
        ).toBeUndefined()

        const savedMessage = await Message.findById(
            response.data.data.message._id
        ).select("+conversationKey")

        expect(savedMessage).not.toBeNull()
        expect(savedMessage.conversationKey).toBe(
            [sender._id.toString(), receiver._id.toString()]
                .sort()
                .join(":")
        )
    })


    test("User cannot send a Message to a missing user", async () => {
        const {user: sender} = await createTestLearner()
        const accessToken = generateAccessToken(sender._id)
        const missingUserId = new mongoose.Types.ObjectId()

        const response = await sendMessage(
            missingUserId.toString(),
            "Test message",
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
        expect(await Message.countDocuments()).toBe(0)
    })


    test("User cannot send a Message without an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        await createTestMatch(sender._id, receiver._id)

        const response = await sendMessage(
            receiver._id.toString(),
            "Test message",
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Message.countDocuments()).toBe(0)
    })


    test("User cannot send a Message after a Match is removed", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        await match.deleteOne()

        const response = await sendMessage(
            receiver._id.toString(),
            "Test message",
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Message.countDocuments()).toBe(0)
    })


    test("User cannot send a Message without access token", async () => {
        const {user: receiver} = await createTestTeacher()

        const response = await sendMessage(
            receiver._id.toString(),
            "Test message"
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
