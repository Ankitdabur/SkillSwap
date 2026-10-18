import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { TEACHING_STYLES } from "../../../src/constants/enums.js"
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
const UPDATE_TEACHING_PROFILE_URL = `http://localhost:${PORT}/api/v1/user/me/update/teaching-profile`

let server

const updateTeachingProfileRequest = async (body, accessToken) => {
    try {
        return await axios.patch(
            UPDATE_TEACHING_PROFILE_URL,
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

describe("Update Teaching Profile", () => {

    test("Teacher can update teaching styles", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const response = await updateTeachingProfileRequest({
            teachingStyles: [
                TEACHING_STYLES.HANDS_ON,
                TEACHING_STYLES.PROJECT_BASED
            ]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.message).toBe("teaching field updated successfully")
        expect(response.data.data.user.teachingStyles).toEqual([
            TEACHING_STYLES.HANDS_ON,
            TEACHING_STYLES.PROJECT_BASED
        ])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.teachingStyles).toEqual([
            TEACHING_STYLES.HANDS_ON,
            TEACHING_STYLES.PROJECT_BASED
        ])
    })

    test("Teacher can update teaching skills", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const skill = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const response = await updateTeachingProfileRequest({
            teachingSkills: [skill._id.toString()]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.user.teachingSkills).toEqual([
            skill._id.toString()
        ])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.teachingSkills[0].equals(skill._id)).toBe(true)
    })

    test("Teacher can update teaching skills and teaching styles together", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const skillOne = await createTestSkill(
            "test-update-skill-one",
            "Test Update Skill One"
        )

        const skillTwo = await createTestSkill(
            "test-update-skill-two",
            "Test Update Skill Two"
        )

        const response = await updateTeachingProfileRequest({
            teachingSkills: [
                skillOne._id.toString(),
                skillTwo._id.toString()
            ],
            teachingStyles: [
                TEACHING_STYLES.HANDS_ON,
                TEACHING_STYLES.INTERACTIVE
            ]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.user.teachingSkills).toEqual([
            skillOne._id.toString(),
            skillTwo._id.toString()
        ])
        expect(response.data.data.user.teachingStyles).toEqual([
            TEACHING_STYLES.HANDS_ON,
            TEACHING_STYLES.INTERACTIVE
        ])

        const updatedUser = await User.findById(user._id)

        expect(
            updatedUser.teachingSkills
        ).toEqual([
            skillOne._id,
            skillTwo._id
        ])

        expect(updatedUser.teachingStyles).toEqual([
            TEACHING_STYLES.HANDS_ON,
            TEACHING_STYLES.INTERACTIVE
        ])
    })

    test("Teacher_Learner can update teaching profile", async () => {
        const { user } = await createTestTeacherLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateTeachingProfileRequest({
            teachingStyles: [
                TEACHING_STYLES.CONCEPT_FOCUSED
            ]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.user.teachingStyles).toEqual([
            TEACHING_STYLES.CONCEPT_FOCUSED
        ])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.teachingStyles).toEqual([
            TEACHING_STYLES.CONCEPT_FOCUSED
        ])
    })

    test("Learner cannot update teaching profile", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateTeachingProfileRequest({
            teachingStyles: [
                TEACHING_STYLES.HANDS_ON
            ]
        }, accessToken)

        expect(response.status).toBe(403)
    })

    test("Teacher cannot update teaching skills with skill that does not exist", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)
        const nonExistingSkillId = new mongoose.Types.ObjectId().toString()

        const response = await updateTeachingProfileRequest({
            teachingSkills: [nonExistingSkillId]
        }, accessToken)

        expect(response.status).toBe(400)
    })

    test("User cannot update teaching profile without access token", async () => {
        await createTestTeacher()

        const response = await updateTeachingProfileRequest({
            teachingStyles: [
                TEACHING_STYLES.HANDS_ON
            ]
        })

        expect(response.status).toBe(401)
    })

    test("Empty teaching profile update request is rejected", async () => {
        const { user } = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const response = await updateTeachingProfileRequest({}, accessToken)

        expect(response.status).toBe(400)
    })

})
