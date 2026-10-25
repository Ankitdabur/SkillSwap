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


const removeMatch = async (matchId, accessToken) => {
    try {
        return await axios.delete(
            `${MATCHES_URL}/${matchId}/remove`,
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


describe("Remove Match", () => {

    test("Sender can remove an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await removeMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "Match removed successfully"
        )
        expect(await Match.findById(match._id)).toBeNull()

        const savedSender = await User.findById(sender._id)
        const savedReceiver = await User.findById(receiver._id)

        expect(savedSender.connections).toBe(0)
        expect(savedReceiver.connections).toBe(0)

        const notification = await Notification.findOne({
            recipient: receiver._id,
            type: NOTIFICATION_TYPES.MATCH_REMOVED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${sender.username} removed your Match`
        )
        expect(notification.isRead).toBe(false)
    })


    test("Receiver can remove an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await removeMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(await Match.findById(match._id)).toBeNull()

        const notification = await Notification.findOne({
            recipient: sender._id,
            type: NOTIFICATION_TYPES.MATCH_REMOVED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            `${receiver.username} removed your Match`
        )
    })


    test("Unrelated user cannot remove an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(unrelatedUser._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await removeMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Match.findById(match._id)).not.toBeNull()

        const savedSender = await User.findById(sender._id)
        const savedReceiver = await User.findById(receiver._id)

        expect(savedSender.connections).toBe(1)
        expect(savedReceiver.connections).toBe(1)
    })


    test("Participant cannot remove a pending Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await removeMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Failed connection decrement rolls back Match removal", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        await User.updateOne(
            {
                _id: receiver._id
            },
            {
                connections: 0
            }
        )

        const response = await removeMatch(
            match._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)

        const savedMatch = await Match.findById(match._id)
        const savedSender = await User.findById(sender._id)
        const savedReceiver = await User.findById(receiver._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.ACCEPTED)
        expect(savedSender.connections).toBe(1)
        expect(savedReceiver.connections).toBe(0)
    })


    test("Removing a missing Match returns not found", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await removeMatch(
            new mongoose.Types.ObjectId().toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("User cannot remove a Match without access token", async () => {
        const response = await removeMatch(
            new mongoose.Types.ObjectId().toString()
        )

        expect(response.status).toBe(401)
    })

})
