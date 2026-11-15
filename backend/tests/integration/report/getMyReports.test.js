import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestReport
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestReports,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const REPORTS_URL = `http://localhost:${PORT}/api/v1/reports`

let server


const getMyReports = async (accessToken, query = "") => {
    try {
        return await axios.get(
            `${REPORTS_URL}/me${query}`,
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
    await cleanupTestReports()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestReports()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get My Reports", () => {

    test("User can get only their Reports with cursor pagination", async () => {
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const {user: otherUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(learner._id)

        const firstReport = await createTestReport(
            learner._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            }
        )

        const secondReport = await createTestReport(
            learner._id,
            teacher._id,
            {
                message: new mongoose.Types.ObjectId()
            }
        )

        await createTestReport(
            otherUser._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            }
        )

        const firstResponse = await getMyReports(
            accessToken,
            "?limit=1"
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.success).toBe(true)
        expect(firstResponse.data.message).toBe(
            "Reports fetched successfully"
        )
        expect(firstResponse.data.data.reports).toHaveLength(1)
        expect(firstResponse.data.data.reports[0]._id).toBe(
            secondReport._id.toString()
        )
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondReport._id.toString(),
            hasMore: true
        })

        const secondResponse = await getMyReports(
            accessToken,
            `?cursor=${secondReport._id}&limit=1`
        )

        expect(secondResponse.status).toBe(200)
        expect(secondResponse.data.data.reports).toHaveLength(1)
        expect(secondResponse.data.data.reports[0]._id).toBe(
            firstReport._id.toString()
        )
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: null,
            hasMore: false
        })
    })


    test("User cannot use another user's Report as their cursor", async () => {
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const {user: otherUser} = await createTestTeacherLearner()
        const otherReport = await createTestReport(
            otherUser._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            }
        )

        const response = await getMyReports(
            generateAccessToken(learner._id),
            `?cursor=${otherReport._id}`
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("Unauthenticated user cannot get Reports", async () => {
        const response = await getMyReports()

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })
})
