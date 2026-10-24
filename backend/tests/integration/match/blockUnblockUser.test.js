import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Match from "../../../src/models/match.model.js"
import User from "../../../src/models/user.model.js"
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


const blockUser = async (userId, accessToken) => {
    try {
        return await axios.put(
            `${MATCHES_URL}/block/${userId}`,
            {},
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const unblockUser = async (userId, accessToken) => {
    try {
        return await axios.delete(
            `${MATCHES_URL}/block/${userId}`,
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


describe("Block And Unblock User", () => {

    test("User can block another user without an existing Match", async () => {
        const {user: blocker} = await createTestLearner()
        const {user: blockedUser} = await createTestTeacher()
        const accessToken = generateAccessToken(blocker._id)

        const response = await blockUser(
            blockedUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "User blocked successfully"
        )
        expect(response.data.data.match.status).toBe(
            MATCH_STATUSES.BLOCKED
        )
        expect(response.data.data.match.blockedBy).toBe(
            blocker._id.toString()
        )
        expect(response.data.data.match.pairKey).toBeUndefined()

        const savedMatch = await Match.findById(
            response.data.data.match._id
        )

        expect(savedMatch.status).toBe(MATCH_STATUSES.BLOCKED)
    })


    test("Receiver can block the sender of a pending request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await blockUser(
            sender._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)

        const savedMatch = await Match.findById(match._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.BLOCKED)
        expect(savedMatch.blockedBy.equals(receiver._id)).toBe(true)
        expect(savedMatch.sender.equals(sender._id)).toBe(true)
        expect(savedMatch.receiver.equals(receiver._id)).toBe(true)
    })


    test("Blocking an accepted Match decrements both connection counts", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(firstUser._id)

        const match = await createTestMatch(
            firstUser._id,
            secondUser._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await blockUser(
            secondUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)

        const savedMatch = await Match.findById(match._id)
        const savedFirstUser = await User.findById(firstUser._id)
        const savedSecondUser = await User.findById(secondUser._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.BLOCKED)
        expect(savedMatch.blockedBy.equals(firstUser._id)).toBe(true)
        expect(savedFirstUser.connections).toBe(0)
        expect(savedSecondUser.connections).toBe(0)
    })


    test("User cannot create another block for an already blocked pair", async () => {
        const {user: blocker} = await createTestLearner()
        const {user: blockedUser} = await createTestTeacher()
        const accessToken = generateAccessToken(blocker._id)

        await createTestMatch(
            blocker._id,
            blockedUser._id,
            MATCH_STATUSES.BLOCKED,
            blocker._id
        )

        const response = await blockUser(
            blockedUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("User cannot block a missing user", async () => {
        const {user: blocker} = await createTestLearner()
        const accessToken = generateAccessToken(blocker._id)

        const response = await blockUser(
            new mongoose.Types.ObjectId().toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
    })


    test("Block transaction rolls back when connection counts cannot decrease", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(firstUser._id)

        const match = await createTestMatch(
            firstUser._id,
            secondUser._id,
            MATCH_STATUSES.ACCEPTED
        )

        await User.updateOne(
            {
                _id: secondUser._id
            },
            {
                connections: 0
            }
        )

        const response = await blockUser(
            secondUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)

        const savedMatch = await Match.findById(match._id)
        const savedFirstUser = await User.findById(firstUser._id)

        expect(savedMatch.status).toBe(MATCH_STATUSES.ACCEPTED)
        expect(savedMatch.blockedBy).toBeNull()
        expect(savedFirstUser.connections).toBe(1)
    })


    test("Original blocker can unblock and delete the Match", async () => {
        const {user: blocker} = await createTestLearner()
        const {user: blockedUser} = await createTestTeacher()
        const accessToken = generateAccessToken(blocker._id)

        const match = await createTestMatch(
            blocker._id,
            blockedUser._id,
            MATCH_STATUSES.BLOCKED,
            blocker._id
        )

        const response = await unblockUser(
            blockedUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "User unblocked successfully"
        )
        expect(await Match.findById(match._id)).toBeNull()
    })


    test("Blocked user cannot remove another user's block", async () => {
        const {user: blocker} = await createTestLearner()
        const {user: blockedUser} = await createTestTeacher()
        const accessToken = generateAccessToken(blockedUser._id)

        const match = await createTestMatch(
            blocker._id,
            blockedUser._id,
            MATCH_STATUSES.BLOCKED,
            blocker._id
        )

        const response = await unblockUser(
            blocker._id.toString(),
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("User cannot unblock a Match that is not blocked", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(firstUser._id)

        const match = await createTestMatch(
            firstUser._id,
            secondUser._id
        )

        const response = await unblockUser(
            secondUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Unblocking a missing Match returns not found", async () => {
        const {user: firstUser} = await createTestLearner()
        const {user: secondUser} = await createTestTeacher()
        const accessToken = generateAccessToken(firstUser._id)

        const response = await unblockUser(
            secondUser._id.toString(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("User cannot block or unblock without access token", async () => {
        const {user} = await createTestTeacher()

        const blockResponse = await blockUser(user._id.toString())
        const unblockResponse = await unblockUser(user._id.toString())

        expect(blockResponse.status).toBe(401)
        expect(unblockResponse.status).toBe(401)
    })

})
