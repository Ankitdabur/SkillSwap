import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Report from "../../../src/models/report.model.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { REPORT_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestAdmin,
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestMessage,
    createTestReport
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestReports,
    cleanupTestMessages,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const ADMIN_URL = `http://localhost:${PORT}/api/v1/admin`

let server


const getReportsByStatus = async (
    status,
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${ADMIN_URL}/reports/status/${status}${query}`,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const getReportById = async (reportId, accessToken) => {
    try {
        return await axios.get(
            `${ADMIN_URL}/reports/${reportId}`,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const decideReport = async (
    reportId,
    decision,
    body,
    accessToken
) => {
    try {
        return await axios.patch(
            `${ADMIN_URL}/reports/${reportId}/${decision}`,
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
    await cleanupTestReports()
    await cleanupTestMessages()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestReports()
    await cleanupTestMessages()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Admin Report Moderation", () => {

    test("Admin can get Reports by status with cursor pagination", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const {user: otherUser} = await createTestTeacherLearner()
        const accessToken = generateAccessToken(admin._id)

        const firstReport = await createTestReport(
            learner._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            },
            {
                reason: "Integration test first pending Report"
            }
        )

        const secondReport = await createTestReport(
            otherUser._id,
            teacher._id,
            {
                message: new mongoose.Types.ObjectId()
            },
            {
                reason: "Integration test second pending Report"
            }
        )

        await createTestReport(
            learner._id,
            teacher._id,
            {
                message: new mongoose.Types.ObjectId()
            },
            {
                status: REPORT_STATUSES.DISMISSED,
                adminResponse: "Integration test dismissed Report"
            }
        )

        const firstResponse = await getReportsByStatus(
            "pending",
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
        expect(firstResponse.data.data.reports[0].reportedBy.username).toBe(
            otherUser.username
        )
        expect(firstResponse.data.data.reports[0].reportedUser.username).toBe(
            teacher.username
        )
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondReport._id.toString(),
            hasMore: true
        })

        const secondResponse = await getReportsByStatus(
            "pending",
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


    test("Admin can get one Report with user and Message evidence", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const message = await createTestMessage(
            learner._id,
            teacher._id,
            "Integration test reported Message"
        )

        await User.findByIdAndUpdate(teacher._id, {
            totalReports: 3
        })

        const report = await createTestReport(
            learner._id,
            teacher._id,
            {
                message: message._id
            }
        )

        const response = await getReportById(
            report._id,
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.data.report._id).toBe(
            report._id.toString()
        )
        expect(response.data.data.report.reportedBy.username).toBe(
            learner.username
        )
        expect(response.data.data.report.reportedUser.username).toBe(
            teacher.username
        )
        expect(response.data.data.report.reportedUser.totalReports).toBe(3)
        expect(response.data.data.report.message.content).toBe(
            "Integration test reported Message"
        )
    })


    test("Admin can resolve a pending Report", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const report = await createTestReport(
            learner._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            }
        )

        const response = await decideReport(
            report._id,
            "resolve",
            {
                adminResponse: "   Integration test Report resolved   "
            },
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "Report resolved successfully"
        )
        expect(response.data.data.report.status).toBe(
            REPORT_STATUSES.RESOLVED
        )
        expect(response.data.data.report.adminResponse).toBe(
            "Integration test Report resolved"
        )

        const resolvedReport = await Report.findById(report._id)

        expect(resolvedReport.status).toBe(REPORT_STATUSES.RESOLVED)
    })


    test("Admin can dismiss a pending Report without a response", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const report = await createTestReport(
            learner._id,
            teacher._id,
            {
                message: new mongoose.Types.ObjectId()
            }
        )

        const response = await decideReport(
            report._id,
            "dismiss",
            {},
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(200)
        expect(response.data.message).toBe(
            "Report dismissed successfully"
        )
        expect(response.data.data.report.status).toBe(
            REPORT_STATUSES.DISMISSED
        )
        expect(response.data.data.report.adminResponse).toBeNull()
    })


    test("Admin cannot decide a Report that is no longer pending", async () => {
        const {user: admin} = await createTestAdmin()
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const report = await createTestReport(
            learner._id,
            teacher._id,
            {
                session: new mongoose.Types.ObjectId()
            },
            {
                status: REPORT_STATUSES.RESOLVED,
                adminResponse: "Integration test already resolved"
            }
        )

        const response = await decideReport(
            report._id,
            "dismiss",
            {},
            generateAccessToken(admin._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
    })


    test("Non-admin cannot access Report moderation", async () => {
        const {user} = await createTestLearner()

        const response = await getReportsByStatus(
            "pending",
            generateAccessToken(user._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.INSUFFICIENT_ROLE)
    })
})
