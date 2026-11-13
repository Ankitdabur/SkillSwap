import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { SESSION_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSession,
    createTestReview
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestReviews,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const REVIEWS_URL = `http://localhost:${PORT}/api/v1/reviews`

let server


const getUserReviews = async (
    userId,
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${REVIEWS_URL}/user/${userId}${query}`,
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
    await cleanupTestReviews()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestReviews()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get User Reviews", () => {

    test("User can get received Reviews with reviewer data and cursor pagination", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const {user: teacherLearner} = await createTestTeacherLearner(
            skill._id
        )
        const accessToken = generateAccessToken(teacher._id)

        const firstSession = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.COMPLETED
        )
        const secondSession = await createTestSession(
            teacher._id,
            teacherLearner._id,
            skill._id,
            SESSION_STATUSES.COMPLETED
        )
        const unrelatedSession = await createTestSession(
            teacherLearner._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.COMPLETED
        )

        const firstReview = await createTestReview(
            firstSession._id,
            learner._id,
            teacher._id,
            {
                rating: 4,
                comment: "First Review"
            }
        )
        const secondReview = await createTestReview(
            secondSession._id,
            teacherLearner._id,
            teacher._id,
            {
                rating: 5,
                comment: "Second Review"
            }
        )

        await createTestReview(
            unrelatedSession._id,
            teacherLearner._id,
            learner._id
        )

        const firstResponse = await getUserReviews(
            teacher._id,
            accessToken,
            "?limit=1"
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.success).toBe(true)
        expect(firstResponse.data.message).toBe(
            "Reviews fetched successfully"
        )
        expect(firstResponse.data.data.reviews).toHaveLength(1)
        expect(firstResponse.data.data.reviews[0]._id).toBe(
            secondReview._id.toString()
        )
        expect(firstResponse.data.data.reviews[0].reviewer).toEqual({
            _id: teacherLearner._id.toString(),
            username: teacherLearner.username,
            fullname: teacherLearner.fullname
        })
        expect(
            firstResponse.data.data.reviews[0].reviewer
        ).not.toHaveProperty("email")
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondReview._id.toString(),
            hasMore: true
        })

        const secondResponse = await getUserReviews(
            teacher._id,
            accessToken,
            `?cursor=${secondReview._id}&limit=1`
        )

        expect(secondResponse.status).toBe(200)
        expect(secondResponse.data.data.reviews).toHaveLength(1)
        expect(secondResponse.data.data.reviews[0]._id).toBe(
            firstReview._id.toString()
        )
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: null,
            hasMore: false
        })
    })


    test("User cannot use another user's Review as cursor", async () => {
        const skill = await createTestSkill(
            "test-session-skill",
            "Test Session Skill"
        )
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher(skill._id)
        const {user: teacherLearner} = await createTestTeacherLearner(
            skill._id
        )
        const accessToken = generateAccessToken(teacher._id)

        const session = await createTestSession(
            teacher._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.COMPLETED
        )

        const otherReview = await createTestReview(
            session._id,
            teacher._id,
            learner._id
        )

        const response = await getUserReviews(
            teacherLearner._id,
            accessToken,
            `?cursor=${otherReview._id}`
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("User without received Reviews gets an empty list", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await getUserReviews(
            user._id,
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.reviews).toEqual([])
        expect(response.data.data.pagination).toEqual({
            limit: 10,
            nextCursor: null,
            hasMore: false
        })
    })


    test("User cannot get Reviews for a user that does not exist", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await getUserReviews(
            new mongoose.Types.ObjectId(),
            accessToken
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
    })


    test("User cannot get Reviews without access token", async () => {
        const {user} = await createTestLearner()

        const response = await getUserReviews(user._id)

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
