import axios from "axios"
import mongoose from "mongoose"
import fs from "fs"
import FormData from "form-data"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { LANGUAGES } from "../../../src/constants/enums.js"
import { createTestLearner } from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js"

const PORT = process.env.PORT || 8000
const UPDATE_PROFILE_URL = `http://localhost:${PORT}/api/v1/user/me/update`
const TEST_AVATAR_PATH = "/Users/ankityadav/Desktop/full stack developer/frontend/src/assets/hero.png"

let server

const updateProfileRequest = async (body, accessToken, avatarPath) => {
    try {
        if(avatarPath){
            const formData = new FormData()

            if(body.fullname){
                formData.append("fullname", body.fullname)
            }

            if(body.languages){
                body.languages.forEach((language) => {
                    formData.append("languages", language)
                })
            }

            formData.append(
                "avatar",
                fs.createReadStream(avatarPath)
            )

            return await axios.patch(
                UPDATE_PROFILE_URL,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            )
        }

        return await axios.patch(
            UPDATE_PROFILE_URL,
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
})

afterAll(async () => {
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})

describe("Update Profile", () => {

    test("User can update fullname", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest({
            fullname: "Updated Learner"
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.message).toBe("User profile updated successfully")
        expect(response.data.data.user.fullname).toBe("Updated Learner")

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.fullname).toBe("Updated Learner")
    })

    test("User can update languages", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest({
            languages: [
                LANGUAGES.ENGLISH,
                LANGUAGES.HINDI
            ]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.user.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])
    })

    test("User can update fullname and languages together", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest({
            fullname: "Updated Learner",
            languages: [
                LANGUAGES.ENGLISH,
                LANGUAGES.HINDI
            ]
        }, accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.user.fullname).toBe("Updated Learner")
        expect(response.data.data.user.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.fullname).toBe("Updated Learner")
        expect(updatedUser.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])
    })

    test("User can update avatar", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest(
            {},
            accessToken,
            TEST_AVATAR_PATH
        )

        expect(response.status).toBe(200)
        expect(response.data.data.user.avatar).toBeDefined()

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.avatar).toBe(response.data.data.user.avatar)
    })

    test("User can update fullname languages and avatar together", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest({
            fullname: "Updated Learner",
            languages: [
                LANGUAGES.ENGLISH,
                LANGUAGES.HINDI
            ]
        }, accessToken, TEST_AVATAR_PATH)

        expect(response.status).toBe(200)
        expect(response.data.data.user.fullname).toBe("Updated Learner")
        expect(response.data.data.user.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])
        expect(response.data.data.user.avatar).toBeDefined()

        const updatedUser = await User.findById(user._id)

        expect(updatedUser.fullname).toBe("Updated Learner")
        expect(updatedUser.languages).toEqual([
            LANGUAGES.ENGLISH,
            LANGUAGES.HINDI
        ])
        expect(updatedUser.avatar).toBe(response.data.data.user.avatar)
    })

    test("Empty profile update request is rejected", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await updateProfileRequest(
            {},
            accessToken
        )

        expect(response.status).toBe(400)
    })

    test("User cannot update profile without access token", async () => {
        await createTestLearner()

        const response = await updateProfileRequest({
            fullname: "Updated Learner"
        })

        expect(response.status).toBe(401)
    })

})
