import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Review from "../../../src/models/review.model.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSession
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


const createReviewRequest = async (body, accessToken) => {
    try {
        return await axios.post(
            REVIEWS_URL,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const createReviewSessionData = async (
    status = SESSION_STATUSES.COMPLETED,
    overrides = {}
) => {
    const skill = await createTestSkill(
        "test-session-skill",
        "Test Session Skill"
    )
    const {user: learner} = await createTestLearner()
    const {user: teacher} = await createTestTeacher(skill._id)

    const session = await createTestSession(
        teacher._id,
        learner._id,
        skill._id,
        status,
        overrides
    )

    return {
        skill,
        learner,
        teacher,
        session
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


describe("Create Review", () => {

    test("Learner can review the teacher of a completed regular Session", async () => {
        const {
            learner,
            teacher,
            session
        } = await createReviewSessionData()

        const response = await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 5,
                comment: "   Excellent teacher   "
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Review created successfully"
        )
        expect(response.data.data.review.session).toBe(
            session._id.toString()
        )
        expect(response.data.data.review.reviewer).toBe(
            learner._id.toString()
        )
        expect(response.data.data.review.reviewedUser).toBe(
            teacher._id.toString()
        )
        expect(response.data.data.review.rating).toBe(5)
        expect(response.data.data.review.comment).toBe(
            "Excellent teacher"
        )

        const savedReview = await Review.findById(
            response.data.data.review._id
        )
        const updatedTeacher = await User.findById(teacher._id)

        expect(savedReview).not.toBeNull()
        expect(updatedTeacher.rating).toBe(5)
        expect(updatedTeacher.totalReviews).toBe(1)
    })


    test("Teacher can review the learner and rating uses the finalized average", async () => {
        const {
            skill,
            learner,
            teacher,
            session
        } = await createReviewSessionData()

        await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 4
            },
            generateAccessToken(teacher._id)
        )

        const {user: teacherLearner} = await createTestTeacherLearner(
            skill._id
        )

        const secondSession = await createTestSession(
            teacherLearner._id,
            learner._id,
            skill._id,
            SESSION_STATUSES.COMPLETED
        )

        const response = await createReviewRequest(
            {
                sessionId: secondSession._id.toString(),
                rating: 5
            },
            generateAccessToken(teacherLearner._id)
        )

        expect(response.status).toBe(201)
        expect(response.data.data.review.reviewedUser).toBe(
            learner._id.toString()
        )

        const updatedLearner = await User.findById(learner._id)

        expect(updatedLearner.rating).toBe(4.5)
        expect(updatedLearner.totalReviews).toBe(2)
    })


    test("User cannot review a Session they did not participate in", async () => {
        const {session} = await createReviewSessionData()
        const {user: otherUser} = await createTestTeacherLearner()

        const response = await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 5
            },
            generateAccessToken(otherUser._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Review.countDocuments()).toBe(0)
    })


    test("User cannot review an incomplete Session", async () => {
        const {
            learner,
            session
        } = await createReviewSessionData(
            SESSION_STATUSES.ACCEPTED
        )

        const response = await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 5
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Review.countDocuments()).toBe(0)
    })


    test("User cannot review a completed Demo Session", async () => {
        const {
            learner,
            session
        } = await createReviewSessionData(
            SESSION_STATUSES.COMPLETED,
            {
                sessionType: SESSION_TYPES.DEMO,
                credits: 0
            }
        )

        const response = await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 5
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Review.countDocuments()).toBe(0)
    })


    test("User cannot review the same Session twice", async () => {
        const {
            learner,
            teacher,
            session
        } = await createReviewSessionData()
        const accessToken = generateAccessToken(learner._id)

        const body = {
            sessionId: session._id.toString(),
            rating: 4
        }

        const firstResponse = await createReviewRequest(
            body,
            accessToken
        )
        const secondResponse = await createReviewRequest(
            body,
            accessToken
        )

        expect(firstResponse.status).toBe(201)
        expect(secondResponse.status).toBe(409)
        expect(secondResponse.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
        expect(await Review.countDocuments()).toBe(1)

        const updatedTeacher = await User.findById(teacher._id)

        expect(updatedTeacher.rating).toBe(4)
        expect(updatedTeacher.totalReviews).toBe(1)
    })


    test("Concurrent duplicate Review requests create one Review only", async () => {
        const {
            learner,
            teacher,
            session
        } = await createReviewSessionData()
        const accessToken = generateAccessToken(learner._id)

        const body = {
            sessionId: session._id.toString(),
            rating: 5
        }

        const responses = await Promise.all([
            createReviewRequest(body, accessToken),
            createReviewRequest(body, accessToken)
        ])

        expect(
            responses.filter((response) => response.status === 201)
        ).toHaveLength(1)
        expect(
            responses.filter((response) => response.status === 409)
        ).toHaveLength(1)
        expect(await Review.countDocuments()).toBe(1)

        const updatedTeacher = await User.findById(teacher._id)

        expect(updatedTeacher.rating).toBe(5)
        expect(updatedTeacher.totalReviews).toBe(1)
    })


    test("Review transaction rolls back when reviewed user does not exist", async () => {
        const {
            learner,
            teacher,
            session
        } = await createReviewSessionData()

        await User.findByIdAndDelete(teacher._id)

        const response = await createReviewRequest(
            {
                sessionId: session._id.toString(),
                rating: 5
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND)
        expect(await Review.countDocuments()).toBe(0)
    })


    test("User cannot create Review without access token", async () => {
        const {session} = await createReviewSessionData()

        const response = await createReviewRequest({
            sessionId: session._id.toString(),
            rating: 5
        })

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
