import axios from "axios"
import mongoose from "mongoose"
import fs from "fs"
import FormData from "form-data"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Message from "../../../src/models/message.model.js"
import Session from "../../../src/models/session.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    MATCH_STATUSES,
    MESSAGE_TYPES,
    SESSION_STATUSES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestAdmin,
    createTestMatch,
    createTestSession
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMessages,
    cleanupTestMatches,
    cleanupTestSessions,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MESSAGES_URL = `http://localhost:${PORT}/api/v1/messages`
const TEST_MESSAGE_IMAGE_PATH =
    "/Users/ankityadav/Desktop/full stack developer/frontend/src/assets/hero.png"

let server


const sendMessage = async (
    receiverId,
    content,
    accessToken,
    imagePath
) => {
    try {
        if(imagePath){
            const formData = new FormData()

            formData.append("receiverId", receiverId)

            if(content !== undefined && content !== null){
                formData.append("content", content)
            }

            formData.append(
                "image",
                fs.createReadStream(imagePath)
            )

            return await axios.post(
                MESSAGES_URL,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            )
        }

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
    await cleanupTestSessions()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestMessages()
    await cleanupTestMatches()
    await cleanupTestSessions()
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
        expect(response.data.data.message.imageUrl).toBeNull()
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


    test("Accepted Match participant can send image Messages", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const imageOnlyResponse = await sendMessage(
            receiver._id.toString(),
            null,
            accessToken,
            TEST_MESSAGE_IMAGE_PATH
        )

        expect(imageOnlyResponse.status).toBe(201)
        expect(imageOnlyResponse.data.data.message.content).toBeNull()
        expect(
            imageOnlyResponse.data.data.message.imageUrl
        ).toMatch(/^https:\/\//)

        const captionResponse = await sendMessage(
            receiver._id.toString(),
            "   Image caption   ",
            accessToken,
            TEST_MESSAGE_IMAGE_PATH
        )

        expect(captionResponse.status).toBe(201)
        expect(captionResponse.data.data.message.content).toBe(
            "Image caption"
        )
        expect(
            captionResponse.data.data.message.imageUrl
        ).toMatch(/^https:\/\//)

        expect(
            await Message.countDocuments({
                sender: sender._id,
                receiver: receiver._id
            })
        ).toBe(2)
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


    test("Admin can start a review conversation and participant can reply", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: participant} = await createTestLearner()
        const {user: otherParticipant} = await createTestTeacher()

        await createTestSession(
            otherParticipant._id,
            participant._id,
            new mongoose.Types.ObjectId(),
            SESSION_STATUSES.UNDER_REVIEW
        )

        const adminResponse = await sendMessage(
            participant._id.toString(),
            "Please provide the Session evidence",
            generateAccessToken(admin._id)
        )

        expect(adminResponse.status).toBe(201)
        expect(adminResponse.data.data.message.messageType).toBe(
            MESSAGE_TYPES.ADMIN_REVIEW
        )

        const participantResponse = await sendMessage(
            admin._id.toString(),
            "I have provided the evidence",
            generateAccessToken(participant._id)
        )

        expect(participantResponse.status).toBe(201)
        expect(participantResponse.data.data.message.messageType).toBe(
            MESSAGE_TYPES.ADMIN_REVIEW
        )
    })


    test("Admin review conversation becomes read-only after review ends", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: participant} = await createTestLearner()
        const {user: otherParticipant} = await createTestTeacher()

        const session = await createTestSession(
            otherParticipant._id,
            participant._id,
            new mongoose.Types.ObjectId(),
            SESSION_STATUSES.UNDER_REVIEW
        )

        await sendMessage(
            participant._id.toString(),
            "Review conversation started",
            generateAccessToken(admin._id)
        )

        await Session.findByIdAndUpdate(session._id, {
            status: SESSION_STATUSES.CANCELLED
        })

        const response = await sendMessage(
            admin._id.toString(),
            "Late response",
            generateAccessToken(participant._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(response.data.message).toBe(
            "Admin review conversation is read-only"
        )
    })

})
