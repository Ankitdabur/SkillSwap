import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Skill from "../../../src/models/skill.model.js"
import SkillRequest from "../../../src/models/skillRequest.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    USER_ROLES,
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES,
    NOTIFICATION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestSkill,
    createTestSkillRequest
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestSkillRequests,
    cleanupTestSkills,
    cleanupTestNotifications,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SKILL_REQUESTS_URL = `http://localhost:${PORT}/api/v1/skill-requests`

let server


const approveSkillRequest = async (
    skillRequestId,
    body,
    accessToken
) => {
    try {
        return await axios.patch(
            `${SKILL_REQUESTS_URL}/admin/${skillRequestId}/approve`,
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


const approvalData = {
    name: "test-update-skill-one",
    displayName: "Test Update Skill One",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Skill created from an approved request",
    adminResponse: "Skill request approved"
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestSkills()
    await cleanupTestNotifications()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestSkills()
    await cleanupTestNotifications()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Approve Skill Request", () => {

    test("Admin can approve a pending skill request", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const skillRequest = await createTestSkillRequest(
            user._id,
            "test-requested-skill"
        )

        const response = await approveSkillRequest(
            skillRequest._id.toString(),
            approvalData,
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Skill request approved successfully"
        )
        expect(response.data.data.skill.name).toBe(
            approvalData.name
        )
        expect(response.data.data.skillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.APPROVED
        )
        expect(response.data.data.skillRequest.adminResponse).toBe(
            approvalData.adminResponse
        )

        const savedSkill = await Skill.findById(
            response.data.data.skill._id
        )

        const savedSkillRequest = await SkillRequest.findById(
            skillRequest._id
        )

        expect(savedSkill).not.toBeNull()
        expect(savedSkillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const notification = await Notification.findOne({
            recipient: user._id,
            type: NOTIFICATION_TYPES.SKILL_REQUEST_APPROVED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            "Admin approved your Skill request for test-requested-skill"
        )
        expect(notification.isRead).toBe(false)
    })


    test("Admin receives not found error when skill request does not exist", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)
        const nonExistingSkillRequestId = new mongoose.Types.ObjectId()

        const response = await approveSkillRequest(
            nonExistingSkillRequestId.toString(),
            approvalData,
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("Admin cannot approve an already reviewed skill request", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const skillRequest = await createTestSkillRequest(
            user._id,
            "test-requested-skill",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const response = await approveSkillRequest(
            skillRequest._id.toString(),
            approvalData,
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_REQUEST
        )
    })


    test("Admin cannot approve request when skill already exists", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        await createTestSkill(
            approvalData.name,
            approvalData.displayName
        )

        const skillRequest = await createTestSkillRequest(
            user._id,
            "test-requested-skill"
        )

        const response = await approveSkillRequest(
            skillRequest._id.toString(),
            approvalData,
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )

        const unchangedSkillRequest = await SkillRequest.findById(
            skillRequest._id
        )

        expect(unchangedSkillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.PENDING
        )
    })


    test("Normal user cannot approve a skill request", async () => {
        const {user: normalUser} = await createTestLearner()
        const {user: requester} = await createTestTeacher()
        const accessToken = generateAccessToken(normalUser._id)

        const skillRequest = await createTestSkillRequest(
            requester._id,
            "test-requested-skill"
        )

        const response = await approveSkillRequest(
            skillRequest._id.toString(),
            approvalData,
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )
    })

})
