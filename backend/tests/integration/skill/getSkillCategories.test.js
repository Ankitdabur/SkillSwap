import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { SKILL_CATEGORIES } from "../../../src/constants/enums.js"




const PORT = process.env.PORT || 8000
const SKILL_CATEGORIES_URL = `http://localhost:${PORT}/api/v1/skills/categories`

let server


const getSkillCategoriesRequest = async () => {
    try {
        return await axios.get(SKILL_CATEGORIES_URL)
    } catch (error) {
        return error.response
    }
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get Skill Categories", () => {

    test("User can get all predefined skill categories", async () => {
        const response = await getSkillCategoriesRequest()

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Skill categories fetched successfully"
        )
        expect(response.data.data.categories).toEqual(
            Object.values(SKILL_CATEGORIES)
        )
    })

})
