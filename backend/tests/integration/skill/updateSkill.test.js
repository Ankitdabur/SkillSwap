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
const SKILLS_URL = `http://localhost:${PORT}/api/v1/skills`

let server


const updateSkillRequest = async (
    skillId,
    body,
    accessToken
) => {
    try {
        return await axios.put(
            `${SKILLS_URL}/${skillId}`,
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


const updatedSkillData = {
    name: "test-update-skill-two",
    displayName: "Test Update Skill Two",
    category: SKILL_CATEGORIES.DESIGN_CREATIVE,
    description: "Updated skill description"
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


describe("Update Skill", () => {

    test("Admin can completely update a skill", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)

        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await updateSkillRequest(
            skill._id.toString(),
            updatedSkillData,
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "skill updated successfully"
        )
        expect(response.data.data.updatedSkill._id).toBe(
            skill._id.toString()
        )
        expect(response.data.data.updatedSkill.name).toBe(
            updatedSkillData.name
        )
        expect(response.data.data.updatedSkill.category).toBe(
            updatedSkillData.category
        )

        const savedSkill = await Skill.findById(skill._id)

        expect(savedSkill.name).toBe(updatedSkillData.name)
        expect(savedSkill.displayName).toBe(
            updatedSkillData.displayName
        )
        expect(savedSkill.description).toBe(
            updatedSkillData.description
        )
    })


    test("Admin cannot update a skill to another existing skill name", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)

        const firstSkill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        await createTestSkill(
            "test-update-skill-two",
            "Test Update Skill Two"
        )

        const response = await updateSkillRequest(
            firstSkill._id.toString(),
            updatedSkillData,
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )

        const unchangedSkill = await Skill.findById(firstSkill._id)

        expect(unchangedSkill.name).toBe("test-update-skill-one")
    })


    test("Admin receives not found error when skill does not exist", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)
        const nonExistingSkillId = new mongoose.Types.ObjectId()

        const response = await updateSkillRequest(
            nonExistingSkillId.toString(),
            updatedSkillData,
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("Normal user cannot update a skill", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await updateSkillRequest(
            skill._id.toString(),
            updatedSkillData,
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )

        const unchangedSkill = await Skill.findById(skill._id)

        expect(unchangedSkill.name).toBe("test-update-skill-one")
    })


    test("User cannot update a skill without access token", async () => {
        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await updateSkillRequest(
            skill._id.toString(),
            updatedSkillData
        )

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
