import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Skill from "../../../src/models/skill.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    USER_ROLES,
    SKILL_CATEGORIES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestSkill
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestUsers,
    cleanupTestSkills
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const CREATE_SKILL_URL = `http://localhost:${PORT}/api/v1/skills`

let server


const createSkillRequest = async (body, accessToken) => {
    try {
        return await axios.post(
            CREATE_SKILL_URL,
            body,
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
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestUsers()
    await cleanupTestSkills()
})


afterAll(async () => {
    await cleanupTestUsers()
    await cleanupTestSkills()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Create Skill", () => {

    test("Admin can create a new skill", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)

        const response = await createSkillRequest(
            {
                name: "   Test-Update-Skill-One   ",
                displayName: "Test Update Skill One",
                category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
                description: "Skill created by admin"
            },
            accessToken
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "new skill created successfully"
        )
        expect(response.data.data.createdSkill.name).toBe(
            "test-update-skill-one"
        )

        const savedSkill = await Skill.findById(
            response.data.data.createdSkill._id
        )

        expect(savedSkill).not.toBeNull()
        expect(savedSkill.displayName).toBe(
            "Test Update Skill One"
        )
    })


    test("Admin cannot create a skill with an existing name", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)

        await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await createSkillRequest(
            {
                name: "TEST-UPDATE-SKILL-ONE",
                displayName: "Duplicate Skill",
                category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
                description: "Duplicate skill"
            },
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )

        const matchingSkills = await Skill.find({
            name: "test-update-skill-one"
        })

        expect(matchingSkills).toHaveLength(1)
    })


    test("Normal user cannot create a skill", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await createSkillRequest(
            {
                name: "test-update-skill-one",
                displayName: "Test Update Skill One",
                category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
                description: "Skill created by user"
            },
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )

        const savedSkill = await Skill.findOne({
            name: "test-update-skill-one"
        })

        expect(savedSkill).toBeNull()
    })


    test("User cannot create a skill without access token", async () => {
        const response = await createSkillRequest({
            name: "test-update-skill-one",
            displayName: "Test Update Skill One",
            category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
            description: "Skill created without authentication"
        })

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
