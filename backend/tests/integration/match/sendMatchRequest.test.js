import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Match from "../../../src/models/match.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { MATCH_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestMatch
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestMatches,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MATCHES_URL = `http://localhost:${PORT}/api/v1/matches`

let server


const sendMatchRequest = async (receiverId, accessToken) => {
    try {
        return await axios.post(
            MATCHES_URL,
            {
                receiverId
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
    await cleanupTestMatches()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestMatches()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Send Match Request", () => {

    test("Logged in user can send a Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const response = await sendMatchRequest(
            receiver._id.toString(),
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Match request sent successfully"
        )
        expect(response.data.data.match.sender).toBe(
            sender._id.toString()
        )
        expect(response.data.data.match.receiver).toBe(
            receiver._id.toString()
        )
        expect(response.data.data.match.status).toBe(
            MATCH_STATUSES.PENDING
        )
        expect(response.data.data.match.pairKey).toBeUndefined()

        const savedMatch = await Match.findById(
            response.data.data.match._id
        ).select("+pairKey")

        expect(savedMatch).not.toBeNull()
        expect(savedMatch.pairKey).toBeDefined()
    })


    test("User cannot send a Match request to a missing user", async () => {
        const {user: sender} = await createTestLearner()
        const accessToken = generateAccessToken(sender._id)
        const missingUserId = new mongoose.Types.ObjectId()

        const response = await sendMatchRequest(
            missingUserId.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
    })


    test("User cannot send a duplicate pending Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        await createTestMatch(sender._id, receiver._id)

        const response = await sendMatchRequest(
            receiver._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("User cannot send a reverse pending Match request", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(secondUser._id)

        await createTestMatch(firstUser._id, secondUser._id)

        const response = await sendMatchRequest(
            firstUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("Matched users cannot send another Match request", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(firstUser._id)

        await createTestMatch(
            firstUser._id,
            secondUser._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await sendMatchRequest(
            secondUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("Blocked users cannot send another Match request", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(secondUser._id)

        await createTestMatch(
            firstUser._id,
            secondUser._id,
            MATCH_STATUSES.BLOCKED,
            firstUser._id
        )

        const response = await sendMatchRequest(
            firstUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("User cannot send a Match request without access token", async () => {
        const {user: receiver} = await createTestTeacher()

        const response = await sendMatchRequest(
            receiver._id.toString()
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
