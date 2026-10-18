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




const PORT = process.env.PORT || 8000
const GET_ALL_SKILLS_URL = `http://localhost:${PORT}/api/v1/skills`

let server


const getAllSkillsRequest = async () => {
    try {
        return await axios.get(GET_ALL_SKILLS_URL)
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


describe("Get All Skills", () => {

    test("User can get predefined skills grouped by category", async () => {
        const firstSkill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const secondSkill = await createTestSkill(
            "test-update-skill-two",
            "Test Update Skill Two"
        )

        const response = await getAllSkillsRequest()

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "All predefined skills fetched successfully"
        )
        expect(Array.isArray(
            response.data.data.groupedSkills
        )).toBe(true)

        const categoryGroup = response.data.data.groupedSkills.find(
            (group) => group.category === firstSkill.category
        )

        expect(categoryGroup).toBeDefined()

        expect(
            categoryGroup.skills.map((skill) => skill._id)
        ).toEqual(
            expect.arrayContaining([
                firstSkill._id.toString(),
                secondSkill._id.toString()
            ])
        )
    })


    test("Skills inside a category are sorted by display name", async () => {
        const secondSkill = await createTestSkill(
            "test-update-skill-two",
            "Test Skill Z"
        )

        const firstSkill = await createTestSkill(
            "test-update-skill-one",
            "Test Skill A"
        )

        const response = await getAllSkillsRequest()

        expect(response.status).toBe(200)

        const categoryGroup = response.data.data.groupedSkills.find(
            (group) => group.category === firstSkill.category
        )

        const firstSkillIndex = categoryGroup.skills.findIndex(
            (skill) => skill._id === firstSkill._id.toString()
        )

        const secondSkillIndex = categoryGroup.skills.findIndex(
            (skill) => skill._id === secondSkill._id.toString()
        )

        expect(firstSkillIndex).toBeGreaterThanOrEqual(0)
        expect(secondSkillIndex).toBeGreaterThanOrEqual(0)
        expect(firstSkillIndex).toBeLessThan(secondSkillIndex)
    })

})
