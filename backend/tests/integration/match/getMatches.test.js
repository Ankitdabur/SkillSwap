import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { MATCH_STATUSES } from "../../../src/constants/enums.js"
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
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const MATCHES_URL = `http://localhost:${PORT}/api/v1/matches`

let server


const getMatches = async (path, accessToken) => {
    try {
        return await axios.get(
            `${MATCHES_URL}/${path}`,
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


describe("Get Matches", () => {

    test("User can get incoming pending Match requests", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: sender} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const incomingMatch = await createTestMatch(
            sender._id,
            loggedInUser._id
        )

        await createTestMatch(
            unrelatedUser._id,
            sender._id
        )

        const response = await getMatches(
            "pending/incoming",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.pendingMatches).toHaveLength(1)
        expect(response.data.data.pendingMatches[0]._id).toBe(
            incomingMatch._id.toString()
        )
        expect(response.data.data.pendingMatches[0].pairKey).toBeUndefined()
    })


    test("User can get outgoing pending Match requests", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: receiver} = await createTestTeacher()
        const {user: unrelatedUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const outgoingMatch = await createTestMatch(
            loggedInUser._id,
            receiver._id
        )

        await createTestMatch(
            receiver._id,
            unrelatedUser._id
        )

        const response = await getMatches(
            "pending/outgoing",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.pendingMatches).toHaveLength(1)
        expect(response.data.data.pendingMatches[0]._id).toBe(
            outgoingMatch._id.toString()
        )
    })


    test("User can get accepted Matches in both directions", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: firstUser} = await createTestTeacher()
        const {user: secondUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const firstMatch = await createTestMatch(
            loggedInUser._id,
            firstUser._id,
            MATCH_STATUSES.ACCEPTED
        )

        const secondMatch = await createTestMatch(
            secondUser._id,
            loggedInUser._id,
            MATCH_STATUSES.ACCEPTED
        )

        const response = await getMatches(
            "accepted",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.acceptedMatches).toHaveLength(2)
        expect(
            response.data.data.acceptedMatches.map(
                (match) => match._id
            )
        ).toEqual(
            expect.arrayContaining([
                firstMatch._id.toString(),
                secondMatch._id.toString()
            ])
        )
    })


    test("User gets only blocks created by them", async () => {
        const {user: loggedInUser} = await createTestLearner()
        const {user: firstUser} = await createTestTeacher()
        const {user: secondUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(loggedInUser._id)

        const createdBlock = await createTestMatch(
            loggedInUser._id,
            firstUser._id,
            MATCH_STATUSES.BLOCKED,
            loggedInUser._id
        )

        await createTestMatch(
            secondUser._id,
            loggedInUser._id,
            MATCH_STATUSES.BLOCKED,
            secondUser._id
        )

        const response = await getMatches(
            "blocked",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.blockedMatches).toHaveLength(1)
        expect(response.data.data.blockedMatches[0]._id).toBe(
            createdBlock._id.toString()
        )
        expect(response.data.data.blockedMatches[0].blockedBy).toBe(
            loggedInUser._id.toString()
        )
    })


    test("User cannot get Matches without access token", async () => {
        const response = await getMatches("accepted")

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
