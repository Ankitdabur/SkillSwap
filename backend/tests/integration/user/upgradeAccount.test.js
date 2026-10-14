import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    ACCOUNT_TYPES,
    TEACHING_STYLES
} from "../../../src/constants/enums.js"

import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestUsers,
    cleanupTestSkills
} from "../../helpers/cleanupTestData.js"

const PORT = process.env.PORT || 8000
const ACCOUNT_UPGRADE_URL = `http://localhost:${PORT}/api/v1/user/me/account-upgrade`

let server

const accountUpgradeRequest = async (body, accessToken) => {
    try {
        return await axios.patch(
            ACCOUNT_UPGRADE_URL,
            body,
            accessToken ? authHeader(accessToken) : undefined
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
    await cleanupTestUsers()
    await cleanupTestSkills()
})

afterAll(async () => {
    await cleanupTestUsers()
    await cleanupTestSkills()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})

describe("Account Upgrade", () => {

    test("Learner can upgrade to Teacher", async () => {
        const { user } = await createTestLearner()
        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER,
            teachingSkills: [skill._id.toString()],
            teachingStyles: [TEACHING_STYLES.HANDS_ON]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.message).toBe("Account upgraded successfully")
        expect(response.data.data.accountType).toBe(ACCOUNT_TYPES.TEACHER)
        expect(response.data.data.teachingSkills).toEqual([skill._id.toString()])
        expect(response.data.data.teachingStyles).toEqual([TEACHING_STYLES.HANDS_ON])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER)
        expect(updatedUser.teachingSkills).toEqual([skill._id])
        expect(updatedUser.teachingStyles).toEqual([TEACHING_STYLES.HANDS_ON])
    })

    test("Learner can upgrade to Teacher_Learner", async () => {
        const { user } = await createTestLearner()
        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
            teachingSkills: [skill._id.toString()],
            teachingStyles: [TEACHING_STYLES.PROJECT_BASED]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.message).toBe("Account upgraded successfully")
        expect(response.data.data.accountType).toBe(ACCOUNT_TYPES.TEACHER_LEARNER)
        expect(response.data.data.teachingSkills).toEqual([skill._id.toString()])
        expect(response.data.data.teachingStyles).toEqual([TEACHING_STYLES.PROJECT_BASED])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER_LEARNER)
        expect(updatedUser.teachingSkills).toEqual([skill._id])
        expect(updatedUser.teachingStyles).toEqual([TEACHING_STYLES.PROJECT_BASED])
    })

    test("Teacher can upgrade to Teacher_Learner", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER_LEARNER
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.message).toBe("Account upgraded successfully")
        expect(response.data.data.accountType).toBe(ACCOUNT_TYPES.TEACHER_LEARNER)
        expect(response.data.data.teachingSkills).toEqual(
            user.teachingSkills.map((skillId) => skillId.toString())
        )
        expect(response.data.data.teachingStyles).toEqual(user.teachingStyles)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER_LEARNER)
        expect(updatedUser.teachingSkills).toEqual(user.teachingSkills)
        expect(updatedUser.teachingStyles).toEqual(user.teachingStyles)
    })

    test("Learner cannot upgrade with teaching skill that does not exist", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)
        const nonExistingSkillId = new mongoose.Types.ObjectId()

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER,
            teachingSkills: [nonExistingSkillId.toString()],
            teachingStyles: [TEACHING_STYLES.HANDS_ON]
        }, accessToken)

        expect(response.status).toBe(400)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.LEARNER)
        expect(updatedUser.teachingSkills).toEqual([])
        expect(updatedUser.teachingStyles).toEqual([])
    })

    test("Learner cannot upgrade to teaching account without teaching profile", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER
        }, accessToken)

        expect(response.status).toBe(400)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.LEARNER)
        expect(updatedUser.teachingSkills).toEqual([])
        expect(updatedUser.teachingStyles).toEqual([])
    })

    test("Teacher cannot provide teaching fields while upgrading to teacher learner", async () => {
        const { user } = await createTestTeacher()
        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
            teachingSkills: [skill._id.toString()],
            teachingStyles: [TEACHING_STYLES.HANDS_ON]
        }, accessToken)

        expect(response.status).toBe(400)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER)
        expect(updatedUser.teachingSkills).toEqual(user.teachingSkills)
        expect(updatedUser.teachingStyles).toEqual(user.teachingStyles)
    })

    test("Teacher cannot upgrade to teacher again", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER
        }, accessToken)

        expect(response.status).toBe(400)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER)
    })

    test("Teacher learner cannot upgrade account again", async () => {
        const { user } = await createTestTeacherLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER_LEARNER
        }, accessToken)

        expect(response.status).toBe(400)

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.accountType).toBe(ACCOUNT_TYPES.TEACHER_LEARNER)
    })

    test("User cannot upgrade account without access token", async () => {
        await createTestLearner()

        const response = await accountUpgradeRequest({
            accountType: ACCOUNT_TYPES.TEACHER
        })

        expect(response.status).toBe(401)
    })

})