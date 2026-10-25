import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import SkillRequest from "../../../src/models/skillRequest.model.js"
import Notification from "../../../src/models/notification.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    USER_ROLES,
    SKILL_REQUEST_STATUSES,
    NOTIFICATION_TYPES
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
    cleanupTestNotifications,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const SKILL_REQUESTS_URL = `http://localhost:${PORT}/api/v1/skill-requests`

let server


const rejectSkillRequest = async (
    skillRequestId,
    body,
    accessToken
) => {
    try {
        return await axios.patch(
            `${SKILL_REQUESTS_URL}/admin/${skillRequestId}/reject`,
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


const rejectionData = {
    adminResponse: "Skill request does not meet requirements"
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestNotifications()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSkillRequests()
    await cleanupTestNotifications()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Reject Skill Request", () => {

    test("Admin can reject a pending skill request", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const skillRequest = await createTestSkillRequest(
            user._id,
            "test-requested-skill"
        )

        const response = await rejectSkillRequest(
            skillRequest._id.toString(),
            rejectionData,
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Skill request rejected successfully"
        )
        expect(response.data.data.skillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.REJECTED
        )
        expect(response.data.data.skillRequest.adminResponse).toBe(
            rejectionData.adminResponse
        )

        const savedSkillRequest = await SkillRequest.findById(
            skillRequest._id
        )

        expect(savedSkillRequest.status).toBe(
            SKILL_REQUEST_STATUSES.REJECTED
        )
        expect(savedSkillRequest.adminResponse).toBe(
            rejectionData.adminResponse
        )

        const notification = await Notification.findOne({
            recipient: user._id,
            type: NOTIFICATION_TYPES.SKILL_REQUEST_REJECTED
        })

        expect(notification).not.toBeNull()
        expect(notification.message).toBe(
            "Admin rejected your Skill request for test-requested-skill"
        )
        expect(notification.isRead).toBe(false)
    })


    test("Admin receives not found error when skill request does not exist", async () => {
        const admin = await createTestAdmin()
        const accessToken = generateAccessToken(admin._id)
        const nonExistingSkillRequestId = new mongoose.Types.ObjectId()

        const response = await rejectSkillRequest(
            nonExistingSkillRequestId.toString(),
            rejectionData,
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    })


    test("Admin cannot reject an already reviewed skill request", async () => {
        const admin = await createTestAdmin()
        const {user} = await createTestTeacher()
        const accessToken = generateAccessToken(admin._id)

        const skillRequest = await createTestSkillRequest(
            user._id,
            "test-requested-skill",
            SKILL_REQUEST_STATUSES.APPROVED
        )

        const response = await rejectSkillRequest(
            skillRequest._id.toString(),
            rejectionData,
            accessToken
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_REQUEST
        )
    })


    test("Normal user cannot reject a skill request", async () => {
        const {user: normalUser} = await createTestLearner()
        const {user: requester} = await createTestTeacher()
        const accessToken = generateAccessToken(normalUser._id)

        const skillRequest = await createTestSkillRequest(
            requester._id,
            "test-requested-skill"
        )

        const response = await rejectSkillRequest(
            skillRequest._id.toString(),
            rejectionData,
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.INSUFFICIENT_ROLE
        )
    })

})
