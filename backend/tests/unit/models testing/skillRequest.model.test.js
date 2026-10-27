import mongoose from "mongoose"
import SkillRequest from "../../../src/models/skillRequest.model.js"
import {
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES
} from "../../../src/constants/enums.js"


describe("SkillRequest Model", () => {

    const createSkillRequestData = (overrides = {}) => ({
        requestedBy: new mongoose.Types.ObjectId(),
        name: "node.js",
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Please add Node.js",
        ...overrides
    })


    const getValidationError = async (skillRequest) => {

        try {
            await skillRequest.validate()
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


    // VALID SKILL REQUEST


    test("Valid skill request passes validation", async () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData()
        )

        await expect(
            skillRequest.validate()
        ).resolves.toBeUndefined()

    })


    // REQUESTED BY


    test("Requested by is required", async () => {

        const data = createSkillRequestData()

        delete data.requestedBy

        const skillRequest = new SkillRequest(data)

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "requestedBy")).toBe(true)

    })


    test("Requested by references the User model", () => {

        const requestedByPath = SkillRequest.schema.path(
            "requestedBy"
        )

        expect(requestedByPath.options.ref).toBe("User")

    })


    // NAME


    test("Name is required", async () => {

        const data = createSkillRequestData()

        delete data.name

        const skillRequest = new SkillRequest(data)

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "name")).toBe(true)

    })


    test("Name is trimmed", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                name: "   node.js   "
            })
        )

        expect(skillRequest.name).toBe("node.js")

    })


    test("Name is converted to lowercase", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                name: "NODE.JS"
            })
        )

        expect(skillRequest.name).toBe("node.js")

    })


    test("Name is configured as indexed", () => {

        const namePath = SkillRequest.schema.path("name")

        expect(namePath.options.index).toBe(1)

    })


    // CATEGORY


    test("Category is required", async () => {

        const data = createSkillRequestData()

        delete data.category

        const skillRequest = new SkillRequest(data)

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "category")).toBe(true)

    })


    test("Finalized skill categories are accepted", async () => {

        for(const category of Object.values(SKILL_CATEGORIES)){

            const skillRequest = new SkillRequest(
                createSkillRequestData({category})
            )

            await expect(
                skillRequest.validate()
            ).resolves.toBeUndefined()

        }

    })


    test("Invalid category is rejected", async () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                category: "INVALID_CATEGORY"
            })
        )

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "category")).toBe(true)

    })


    // DESCRIPTION


    test("Description is required", async () => {

        const data = createSkillRequestData()

        delete data.description

        const skillRequest = new SkillRequest(data)

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "description")).toBe(true)

    })


    test("Description is trimmed", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                description: "   Please add Node.js   "
            })
        )

        expect(skillRequest.description).toBe(
            "Please add Node.js"
        )

    })


    // STATUS


    test("Status defaults to PENDING", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData()
        )

        expect(skillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.PENDING
        )

    })


    test("Finalized skill request statuses are accepted", async () => {

        for(const status of Object.values(SKILL_REQUEST_STATUSES)){

            const data = createSkillRequestData({status})

            if(status === SKILL_REQUEST_STATUSES.REJECTED){
                data.adminResponse = "Request rejected by admin"
            }

            const skillRequest = new SkillRequest(data)

            await expect(
                skillRequest.validate()
            ).resolves.toBeUndefined()

        }

    })


    test("Invalid status is rejected", async () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                status: "INVALID_STATUS"
            })
        )

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "status")).toBe(true)

    })


    // ADMIN RESPONSE


    test("Admin response defaults to null", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData()
        )

        expect(skillRequest.adminResponse).toBeNull()

    })


    test("Admin response is trimmed", () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                adminResponse: "   Approved by admin   "
            })
        )

        expect(skillRequest.adminResponse).toBe(
            "Approved by admin"
        )

    })


    test("Rejected skill request requires admin response", async () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                status: SKILL_REQUEST_STATUSES.REJECTED
            })
        )

        const error = await getValidationError(skillRequest)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "adminResponse")).toBe(true)
        expect(error.errors.adminResponse.message).toBe(
            "Rejected SkillRequest must have adminResponse"
        )

    })


    test("Rejected skill request accepts admin response", async () => {

        const skillRequest = new SkillRequest(
            createSkillRequestData({
                status: SKILL_REQUEST_STATUSES.REJECTED,
                adminResponse: "Skill request rejected"
            })
        )

        await expect(
            skillRequest.validate()
        ).resolves.toBeUndefined()

    })


    // INDEXES


    test("SkillRequest has status and creation time index", () => {

        const indexes = SkillRequest.schema.indexes()

        const statusIndex = indexes.find(
            ([fields]) =>
                fields.status === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1 &&
                fields.requestedBy === undefined
        )

        expect(statusIndex).toBeDefined()

    })


    test("SkillRequest has requested by status and creation time index", () => {

        const indexes = SkillRequest.schema.indexes()

        const userStatusIndex = indexes.find(
            ([fields]) =>
                fields.requestedBy === 1 &&
                fields.status === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(userStatusIndex).toBeDefined()

    })


    // TIMESTAMPS


    test("SkillRequest schema has timestamps enabled", () => {

        expect(
            SkillRequest.schema.options.timestamps
        ).toBe(true)

    })

})
