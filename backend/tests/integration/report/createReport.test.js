import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Report from "../../../src/models/report.model.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { SESSION_STATUSES } from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSession,
    createTestMessage
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestReports,
    cleanupTestMessages,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const REPORTS_URL = `http://localhost:${PORT}/api/v1/reports`

let server


const createReportRequest = async (body, accessToken) => {
    try {
        return await axios.post(
            REPORTS_URL,
            body,
            accessToken ? authHeader(accessToken) : undefined
        )
    } catch (error) {
        return error.response
    }
}


const createCompletedSessionData = async () => {
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
        SESSION_STATUSES.COMPLETED
    )

    return {
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
    await cleanupTestReports()
    await cleanupTestMessages()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestReports()
    await cleanupTestMessages()
    await cleanupTestSessions()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Create Report", () => {

    test("Session participant can report the other participant after completion", async () => {
        const {
            learner,
            teacher,
            session
        } = await createCompletedSessionData()

        const response = await createReportRequest(
            {
                sessionId: session._id.toString(),
                reason: "   Integration test Session report   "
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(201)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "Report created successfully"
        )
        expect(response.data.data.report.session).toBe(
            session._id.toString()
        )
        expect(response.data.data.report.reportedBy).toBe(
            learner._id.toString()
        )
        expect(response.data.data.report.reportedUser).toBe(
            teacher._id.toString()
        )
        expect(response.data.data.report.reason).toBe(
            "Integration test Session report"
        )

        const savedReport = await Report.findById(
            response.data.data.report._id
        )
        const reportedTeacher = await User.findById(teacher._id)

        expect(savedReport).not.toBeNull()
        expect(reportedTeacher.totalReports).toBe(1)
    })


    test("Message participant can report a deleted Message", async () => {
        const {user: learner} = await createTestLearner()
        const {user: teacher} = await createTestTeacher()
        const message = await createTestMessage(
            learner._id,
            teacher._id,
            "Inappropriate integration test message",
            false,
            true
        )

        const response = await createReportRequest(
            {
                messageId: message._id.toString(),
                reason: "Integration test Message report"
            },
            generateAccessToken(teacher._id)
        )

        expect(response.status).toBe(201)
        expect(response.data.data.report.message).toBe(
            message._id.toString()
        )
        expect(response.data.data.report.reportedBy).toBe(
            teacher._id.toString()
        )
        expect(response.data.data.report.reportedUser).toBe(
            learner._id.toString()
        )

        const reportedLearner = await User.findById(learner._id)

        expect(reportedLearner.totalReports).toBe(1)
    })


    test("User cannot report a Session they did not participate in", async () => {
        const {
            teacher,
            session
        } = await createCompletedSessionData()
        const {user: otherUser} = await createTestTeacherLearner()

        const response = await createReportRequest(
            {
                sessionId: session._id.toString(),
                reason: "Integration test unauthorized report"
            },
            generateAccessToken(otherUser._id)
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(ERROR_CODES.FORBIDDEN)
        expect(await Report.countDocuments({
            session: session._id,
            reportedBy: otherUser._id
        })).toBe(0)

        const unchangedTeacher = await User.findById(teacher._id)

        expect(unchangedTeacher.totalReports).toBe(0)
    })


    test("User cannot report a Session before it is completed", async () => {
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
            SESSION_STATUSES.ACCEPTED
        )

        const response = await createReportRequest(
            {
                sessionId: session._id.toString(),
                reason: "Integration test early report"
            },
            generateAccessToken(learner._id)
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(ERROR_CODES.INVALID_REQUEST)
        expect(await Report.countDocuments({
            session: session._id,
            reportedBy: learner._id
        })).toBe(0)
    })


    test("User cannot report the same Session twice", async () => {
        const {
            learner,
            teacher,
            session
        } = await createCompletedSessionData()
        const accessToken = generateAccessToken(learner._id)
        const body = {
            sessionId: session._id.toString(),
            reason: "Integration test duplicate report"
        }

        await createReportRequest(body, accessToken)
        const response = await createReportRequest(body, accessToken)

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
        expect(await Report.countDocuments({
            session: session._id,
            reportedBy: learner._id
        })).toBe(1)

        const reportedTeacher = await User.findById(teacher._id)

        expect(reportedTeacher.totalReports).toBe(1)
    })
})
