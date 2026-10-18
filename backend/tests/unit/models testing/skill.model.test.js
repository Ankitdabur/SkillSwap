import Skill from "../../../src/models/skill.model.js"
import {SKILL_CATEGORIES} from "../../../src/constants/enums.js"


describe("Skill Model", () => {

    const createSkillData = (overrides = {}) => ({
        name: "javascript",
        displayName: "JavaScript",
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Learn JavaScript programming",
        ...overrides
    })


    const getValidationError = async (skill) => {

        try {
            await skill.validate()
            return null
        } catch (error) {
            return error
        }

    }


    const hasFieldError = (error, field) => {

        return Object.keys(error.errors).some(
            (key) => key === field
        )

    }


    // VALID SKILL


    test("Valid skill passes validation", async () => {

        const skill = new Skill(createSkillData())

        await expect(skill.validate()).resolves.toBeUndefined()

    })


    // NAME


    test("Name is required", async () => {

        const data = createSkillData()

        delete data.name

        const skill = new Skill(data)

        const error = await getValidationError(skill)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "name")).toBe(true)

    })


    test("Name is trimmed", () => {

        const skill = new Skill(
            createSkillData({
                name: "   javascript   "
            })
        )

        expect(skill.name).toBe("javascript")

    })


    test("Name is converted to lowercase", () => {

        const skill = new Skill(
            createSkillData({
                name: "JAVASCRIPT"
            })
        )

        expect(skill.name).toBe("javascript")

    })


    test("Name is configured as unique", () => {

        const namePath = Skill.schema.path("name")

        expect(namePath.options.unique).toBe(true)

    })


    // DISPLAY NAME


    test("Display name is required", async () => {

        const data = createSkillData()

        delete data.displayName

        const skill = new Skill(data)

        const error = await getValidationError(skill)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "displayName")).toBe(true)

    })


    test("Display name is trimmed", () => {

        const skill = new Skill(
            createSkillData({
                displayName: "   JavaScript   "
            })
        )

        expect(skill.displayName).toBe("JavaScript")

    })


    // CATEGORY


    test("Category is required", async () => {

        const data = createSkillData()

        delete data.category

        const skill = new Skill(data)

        const error = await getValidationError(skill)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "category")).toBe(true)

    })


    test("Finalized skill categories are accepted", async () => {

        for(const category of Object.values(SKILL_CATEGORIES)){

            const skill = new Skill(
                createSkillData({category})
            )

            await expect(skill.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid category is rejected", async () => {

        const skill = new Skill(
            createSkillData({
                category: "INVALID_CATEGORY"
            })
        )

        const error = await getValidationError(skill)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "category")).toBe(true)

    })


    // DESCRIPTION


    test("Description is required", async () => {

        const data = createSkillData()

        delete data.description

        const skill = new Skill(data)

        const error = await getValidationError(skill)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "description")).toBe(true)

    })


    test("Description is trimmed", () => {

        const skill = new Skill(
            createSkillData({
                description: "   Learn JavaScript programming   "
            })
        )

        expect(skill.description).toBe("Learn JavaScript programming")

    })


    // TIMESTAMPS


    test("Skill schema has timestamps enabled", () => {

        expect(
            Skill.schema.options.timestamps
        ).toBe(true)

    })

})
