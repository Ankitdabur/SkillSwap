import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import SkillRequest from "../../../src/models/skillRequest.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestSkill,
    createTestSkillRequest
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestSkillRequests,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SKILL_REQUESTS_URL = `http://localhost:${PORT}/api/v1/skill-requests`

let server


const createSkillRequest = async (body, accessToken) => {
    try {
        return await axios.post(
            SKILL_REQUESTS_URL,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const validSkillRequestData = {
    name: "test-requested-skill",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Please add this skill"
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Create Skill Request", () => {

    test("Logged in user can create a skill request", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await createSkillRequest(
            {
                ...validSkillRequestData,
                name: "   Test-Requested-Skill   "
            },
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Skill request created successfully"
        )
        expect(response.data.data.skillRequest.name).toBe(
            "test-requested-skill"
        )
        expect(response.data.data.skillRequest.requestedBy).toBe(
            user._id.toString()
        )
        expect(response.data.data.skillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.PENDING
        )

        const savedSkillRequest = await SkillRequest.findById(
            response.data.data.skillRequest._id
        )

        expect(savedSkillRequest).not.toBeNull()
        expect(savedSkillRequest.requestedBy.toString()).toBe(
            user._id.toString()
        )
    })


    test("User cannot create duplicate pending skill request", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await createTestSkillRequest(
            user._id,
            validSkillRequestData.name
        )

        const response = await createSkillRequest(
            validSkillRequestData,
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("User cannot request a skill that already exists", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await createSkillRequest(
            {
                ...validSkillRequestData,
                name: "TEST-UPDATE-SKILL-ONE"
            },
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    })


    test("User cannot create skill request without access token", async () => {
        const response = await createSkillRequest(
            validSkillRequestData
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
