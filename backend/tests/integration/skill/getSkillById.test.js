import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import {
    createTestSkill
} from "../../helpers/createTestUser.js"
import {
    cleanupTestSkills
} from "../../helpers/cleanupTestData.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"




const PORT = process.env.PORT || 8000
const SKILLS_URL = `http://localhost:${PORT}/api/v1/skills`

let server


const getSkillByIdRequest = async (skillId) => {
    try {
        return await axios.get(
            `${SKILLS_URL}/${skillId}`
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
    await cleanupTestSkills()
})


afterAll(async () => {
    await cleanupTestSkills()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get Skill By Id", () => {

    test("User can get a skill by id", async () => {
        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await getSkillByIdRequest(
            skill._id.toString()
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Skill fetched successfully"
        )
        expect(response.data.data.skill._id).toBe(
            skill._id.toString()
        )
        expect(response.data.data.skill.name).toBe(skill.name)
        expect(response.data.data.skill.displayName).toBe(
            skill.displayName
        )
    })


    test("User cannot get a skill with invalid id", async () => {
        const response = await getSkillByIdRequest(
            "invalid-skill-id"
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("User receives not found error for a skill that does not exist", async () => {
        const nonExistingSkillId = new mongoose.Types.ObjectId()

        const response = await getSkillByIdRequest(
            nonExistingSkillId.toString()
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })

})
