import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { SKILL_REQUEST_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestSkillRequest
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestSkillRequests,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SKILL_REQUESTS_URL = `http://localhost:${PORT}/api/v1/skill-requests`

let server


const getMySkillRequests = async (status, accessToken) => {
    try {
        return await axios.get(
            `${SKILL_REQUESTS_URL}/me/${status}`,
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
    await cleanupTestSkillRequests()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get My Skill Requests", () => {

    test("User can get their pending skill requests", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const pendingSkillRequest = await createTestSkillRequest(
            user._id,
            "test-pending-skill-request"
        )

        await createTestSkillRequest(
            user._id,
            "test-approved-skill-request",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const response = await getMySkillRequests(
            "pending",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Pending skill requests fetched successfully"
        )
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            pendingSkillRequest._id.toString()
        )
    })


    test("User can get their approved skill requests", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await createTestSkillRequest(
            user._id,
            "test-pending-skill-request"
        )

        const approvedSkillRequest = await createTestSkillRequest(
            user._id,
            "test-approved-skill-request",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const response = await getMySkillRequests(
            "approved",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            approvedSkillRequest._id.toString()
        )
        expect(response.data.data.skillRequests[0].status).toBe(
            SKILL_REQUEST_STATUSES.APPROVED
        )
    })


    test("User can get their rejected skill requests", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await createTestSkillRequest(
            user._id,
            "test-pending-skill-request"
        )

        const rejectedSkillRequest = await createTestSkillRequest(
            user._id,
            "test-rejected-skill-request",
            SKILL_REQUEST_STATUSES.REJECTED
        )

        const response = await getMySkillRequests(
            "rejected",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            rejectedSkillRequest._id.toString()
        )
        expect(response.data.data.skillRequests[0].adminResponse).toBe(
            "Skill request rejected for integration testing"
        )
    })


    test("User receives only their own skill requests", async () => {
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const accessToken = generateAccessToken(learner._id)

        const learnerSkillRequest = await createTestSkillRequest(
            learner._id,
            "test-learner-skill-request"
        )

        await createTestSkillRequest(
            teacher._id,
            "test-teacher-skill-request"
        )

        const response = await getMySkillRequests(
            "pending",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            learnerSkillRequest._id.toString()
        )
        expect(response.data.data.skillRequests[0].requestedBy).toBe(
            learner._id.toString()
        )
    })


    test("User cannot get their skill requests without access token", async () => {
        const response = await getMySkillRequests("pending")

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
