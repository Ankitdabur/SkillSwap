import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    USER_ROLES,
    SKILL_REQUEST_STATUSES
} from "../../../src/constants/enums.js"
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


const getAdminSkillRequests = async (
    status,
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${SKILL_REQUESTS_URL}/admin/${status}${query}`,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const createTestAdmin = async () => {
    const {user} = await createTestLearner()

    user.role = USER_ROLES.ADMIN
    await user.save()

    return user
}


beforeAll(async () => {
    await dbconnect()
    await cleanupTestSkillRequests()
    await cleanupTestUsers()
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


describe("Get Skill Requests As Admin", () => {

    test("Admin can get pending skill requests with cursor pagination", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const firstPendingSkillRequest = await createTestSkillRequest(
            user._id,
            "test-pending-skill-request-one"
        )

        const secondPendingSkillRequest = await createTestSkillRequest(
            user._id,
            "test-pending-skill-request-two"
        )

        await createTestSkillRequest(
            user._id,
            "test-approved-skill-request",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const firstResponse = await getAdminSkillRequests(
            "pending",
            accessToken,
            "?limit=1"
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.success).toBe(true)
        expect(firstResponse.data.message).toBe(
            "Pending skill requests fetched successfully"
        )
        expect(firstResponse.data.data.skillRequests).toHaveLength(1)
        expect(firstResponse.data.data.skillRequests[0]._id).toBe(
            secondPendingSkillRequest._id.toString()
        )
        expect(firstResponse.data.data.skillRequests[0].status).toBe(
            SKILL_REQUEST_STATUSES.PENDING
        )
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondPendingSkillRequest._id.toString(),
            hasMore: true
        })

        const secondResponse = await getAdminSkillRequests(
            "pending",
            accessToken,
            `?cursor=${secondPendingSkillRequest._id}&limit=1`
        )

        expect(secondResponse.status).toBe(200)
        expect(secondResponse.data.data.skillRequests).toHaveLength(1)
        expect(secondResponse.data.data.skillRequests[0]._id).toBe(
            firstPendingSkillRequest._id.toString()
        )
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: null,
            hasMore: false
        })
    })


    test("Admin can get approved skill requests", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const approvedSkillRequest = await createTestSkillRequest(
            user._id,
            "test-approved-skill-request",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        await createTestSkillRequest(
            user._id,
            "test-pending-skill-request"
        )

        const response = await getAdminSkillRequests(
            "approved",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            approvedSkillRequest._id.toString()
        )
        expect(response.data.data.pagination).toEqual({
            limit: 10,
            nextCursor: null,
            hasMore: false
        })
    })


    test("Admin can get rejected skill requests", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const rejectedSkillRequest = await createTestSkillRequest(
            user._id,
            "test-rejected-skill-request",
            SKILL_REQUEST_STATUSES.REJECTED
        )

        await createTestSkillRequest(
            user._id,
            "test-pending-skill-request"
        )

        const response = await getAdminSkillRequests(
            "rejected",
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.skillRequests).toHaveLength(1)
        expect(response.data.data.skillRequests[0]._id).toBe(
            rejectedSkillRequest._id.toString()
        )
        expect(response.data.data.pagination).toEqual({
            limit: 10,
            nextCursor: null,
            hasMore: false
        })
    })


    test("Admin cannot use a SkillRequest from another status as cursor", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const approvedSkillRequest = await createTestSkillRequest(
            user._id,
            "test-approved-skill-request",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const response = await getAdminSkillRequests(
            "pending",
            accessToken,
            `?cursor=${approvedSkillRequest._id}`
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("Normal user cannot get admin skill requests", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await getAdminSkillRequests(
            "pending",
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )
    })

})
