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


const deletePendingMatch = async (matchId, action, accessToken) => {
    try {
        return await axios.delete(
            `${MATCHES_URL}/${matchId}/${action}`,
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


describe("Reject And Cancel Match", () => {

    test("Receiver can reject and delete a pending Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "reject",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "Match request rejected successfully"
        )
        expect(await Match.findById(match._id)).toBeNull()

        const savedSender = await User.findById(sender._id)
        const savedReceiver = await User.findById(receiver._id)

        expect(savedSender.connections).toBe(0)
        expect(savedReceiver.connections).toBe(0)
    })


    test("Sender cannot reject their own Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "reject",
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Receiver cannot reject an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "reject",
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Sender can cancel and delete a pending Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "cancel",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "Match request cancelled successfully"
        )
        expect(await Match.findById(match._id)).toBeNull()
    })


    test("Receiver cannot cancel an incoming Match request", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(receiver._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "cancel",
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Sender cannot cancel an accepted Match", async () => {
        const {user: sender} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const accessToken = generateAccessToken(sender._id)

        const match = await createTestMatch(
            sender._id,
            receiver._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await deletePendingMatch(
            match._id.toString(),
            "cancel",
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Match.findById(match._id)).not.toBeNull()
    })


    test("Rejecting or cancelling a missing Match returns not found", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const missingMatchId = new mongoose.Types.ObjectId().toString()

        const rejectResponse = await deletePendingMatch(
            missingMatchId,
            "reject",
            accessToken
        )

        const cancelResponse = await deletePendingMatch(
            missingMatchId,
            "cancel",
            accessToken
        )

        expect(rejectResponse.status).toBe(404)
        expect(cancelResponse.status).toBe(404)
    })


    test("User cannot reject or cancel without access token", async () => {
        const matchId = new mongoose.Types.ObjectId().toString()

        const rejectResponse = await deletePendingMatch(
            matchId,
            "reject"
        )

        const cancelResponse = await deletePendingMatch(
            matchId,
            "cancel"
        )

        expect(rejectResponse.status).toBe(401)
        expect(cancelResponse.status).toBe(401)
    })

})
