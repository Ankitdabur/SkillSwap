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


const deleteMessage = async (messageId, accessToken) => {
    try {
        return await axios.delete(
            `${MESSAGES_URL}/${messageId}`,
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


describe("Delete Message", () => {

    test("Message sender can soft-delete their Message", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const message = await createTestMessage(
            sender._id,
            receiver._id,
            "Original Message content"
        )

        const response = await deleteMessage(
            message._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Message deleted successfully"
        )
        expect(response.data.data.messageId).toBe(
            message._id.toString()
        )
        expect(response.data.data.isDeleted).toBe(true)

        const savedMessage = await Message.findById(message._id)

        expect(savedMessage).not.toBeNull()
        expect(savedMessage.isDeleted).toBe(true)
        expect(savedMessage.content).toBe("Original Message content")
    })


    test("Deleting an already deleted Message remains successful", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const message = await createTestMessage(
            sender._id,
            receiver._id,
            "Deleted Message",
            false,
            true
        )

        const response = await deleteMessage(
            message._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.isDeleted).toBe(true)
    })


    test("Message receiver cannot delete the Message", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const message = await createTestMessage(
            sender._id,
            receiver._id,
            "Sender's Message"
        )

        const response = await deleteMessage(
            message._id.toString(),
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)

        const savedMessage = await Message.findById(message._id)

        expect(savedMessage.isDeleted).toBe(false)
    })


    test("Deleting a missing Message returns not found", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const missingMessageId = new mongoose.Types.ObjectId()

        const response = await deleteMessage(
            missingMessageId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("User cannot delete a Message without access token", async () => {
        const response = await deleteMessage(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
