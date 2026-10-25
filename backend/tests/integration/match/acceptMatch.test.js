import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Match from "../../../src/models/match.model.js"
import User from "../../../src/models/user.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    MATCH_STATUSES,
    NOTIFICATION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestMatch
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMatches,
    cleanupTestNotifications,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MATCHES_URL = `http://localhost:${PORT}/api/v1/matches`

let server


const acceptMatch = async (matchId, accessToken) => {
    try {
        return await axios.patch(
            `${MATCHES_URL}/${matchId}/accept`,
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
    await cleanupTestMatches()
    await cleanupTestNotifications()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestMatches()
    await cleanupTestNotifications()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Accept Match", () => {

    test("Receiver can accept a pending Match request only once", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await acceptMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Match request accepted successfully"
        )
        expect(response.data.data.match.status).toBe(
            MATCH_STATUSES.ACCEPTED
        )
        expect(response.data.data.match.pairKey).toBeUndefined()

        const savedMatch = await Match.findById(match._id)
        const savedSender = await User.findById(sender._id)
        const savedReceiver = await User.findById(receiver._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.ACCEPTED)
        expect(savedSender.connections).toBe(1)
        expect(savedReceiver.connections).toBe(1)

        const notification = await Notification.findOne({
            recipient: sender._id,
            type: NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${receiver.username} accepted your Match request`
        )
        expect(notification.isRead).toBe(false)

        const repeatedResponse = await acceptMatch(
            match._id.toString(),
            accessToken
        )

        expect(repeatedResponse.status).toBe(409)

        const senderAfterRepeatedRequest = await User.findById(
            sender._id
        )
        const receiverAfterRepeatedRequest = await User.findById(
            receiver._id
        )

        expect(senderAfterRepeatedRequest.connections).toBe(1)
        expect(receiverAfterRepeatedRequest.connections).toBe(1)
        expect(
            await Notification.countDocuments({
                recipient: sender._id,
                type: NOTIFICATION_TYPES.MATCH_REQUEST_ACCEPTED
            })
        ).toBe(1)
    })


    test("Sender cannot accept their own Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await acceptMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)

        const savedMatch = await Match.findById(match._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.PENDING)
    })


    test("Unrelated user cannot accept a Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(unrelatedUser._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await acceptMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
    })


    test("Receiver receives not found error for missing Match", async () => {
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)
        const missingMatchId = new mongoose.Types.ObjectId()

        const response = await acceptMatch(
            missingMatchId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("User cannot accept a Match without access token", async () => {
        const response = await acceptMatch(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
