import mongoose from "mongoose"
import Report from "../../../src/models/report.model.js"
import { REPORT_STATUSES } from "../../../src/constants/enums.js"


describe("Report Model", () => {

    const createSessionReportData = (overrides = {}) => ({
        session: new mongoose.Types.ObjectId(),
        reportedBy: new mongoose.Types.ObjectId(),
        reportedUser: new mongoose.Types.ObjectId(),
        reason: "Inappropriate Session behavior",
        ...overrides
    })


    const createMessageReportData = (overrides = {}) => ({
        message: new mongoose.Types.ObjectId(),
        reportedBy: new mongoose.Types.ObjectId(),
        reportedUser: new mongoose.Types.ObjectId(),
        reason: "Inappropriate Message",
        ...overrides
    })


    const getValidationError = async (report) => {

        try {
            await report.validate()
            return null
        } catch (error) {
            return error
        }

    }


    const hasFieldError = (error, field) => {

        return Object.keys(error.errors).some(
            (key) => key === field
        )

    }


    // VALID REPORTS


    test("Valid Session Report passes validation", async () => {

        const report = new Report(createSessionReportData())

        await expect(report.validate()).resolves.toBeUndefined()

    })


    test("Valid Message Report passes validation", async () => {

        const report = new Report(createMessageReportData())

        await expect(report.validate()).resolves.toBeUndefined()

    })


    test("Report requires exactly one Session or Message reference", async () => {

        const noReferenceReport = new Report(
            createSessionReportData({
                session: null
            })
        )

        const bothReferencesReport = new Report(
            createSessionReportData({
                message: new mongoose.Types.ObjectId()
            })
        )

        const noReferenceError = await getValidationError(
            noReferenceReport
        )
        const bothReferencesError = await getValidationError(
            bothReferencesReport
        )

        expect(noReferenceError).toBeDefined()
        expect(
            hasFieldError(noReferenceError, "session") ||
            hasFieldError(noReferenceError, "message")
        ).toBe(true)
        expect(bothReferencesError).toBeDefined()
        expect(
            hasFieldError(bothReferencesError, "session") ||
            hasFieldError(bothReferencesError, "message")
        ).toBe(true)

    })


    // REFERENCES


    test("Session references Session model and is immutable", () => {

        const sessionPath = Report.schema.path("session")

        expect(sessionPath.options.ref).toBe("Session")
        expect(sessionPath.options.immutable).toBe(true)

    })


    test("Message references Message model and is immutable", () => {

        const messagePath = Report.schema.path("message")

        expect(messagePath.options.ref).toBe("Message")
        expect(messagePath.options.immutable).toBe(true)

    })


    test("Invalid Session and Message IDs are rejected", async () => {

        const sessionError = await getValidationError(
            new Report(
                createSessionReportData({
                    session: "invalid-session-id"
                })
            )
        )

        const messageError = await getValidationError(
            new Report(
                createMessageReportData({
                    message: "invalid-message-id"
                })
            )
        )

        expect(hasFieldError(sessionError, "session")).toBe(true)
        expect(hasFieldError(messageError, "message")).toBe(true)

    })


    // USERS


    test("Reported by is required, references User, and is immutable", async () => {

        const data = createSessionReportData()

        delete data.reportedBy

        const error = await getValidationError(new Report(data))
        const reportedByPath = Report.schema.path("reportedBy")

        expect(hasFieldError(error, "reportedBy")).toBe(true)
        expect(reportedByPath.options.ref).toBe("User")
        expect(reportedByPath.options.immutable).toBe(true)

    })


    test("Reported user is required, references User, and is immutable", async () => {

        const data = createSessionReportData()

        delete data.reportedUser

        const error = await getValidationError(new Report(data))
        const reportedUserPath = Report.schema.path("reportedUser")

        expect(hasFieldError(error, "reportedUser")).toBe(true)
        expect(reportedUserPath.options.ref).toBe("User")
        expect(reportedUserPath.options.immutable).toBe(true)

    })


    test("Invalid reported user IDs are rejected", async () => {

        const reportedByError = await getValidationError(
            new Report(
                createSessionReportData({
                    reportedBy: "invalid-user-id"
                })
            )
        )

        const reportedUserError = await getValidationError(
            new Report(
                createSessionReportData({
                    reportedUser: "invalid-user-id"
                })
            )
        )

        expect(hasFieldError(reportedByError, "reportedBy")).toBe(true)
        expect(hasFieldError(reportedUserError, "reportedUser")).toBe(true)

    })


    test("Reporting and reported users must be different", async () => {

        const userId = new mongoose.Types.ObjectId()

        const error = await getValidationError(
            new Report(
                createSessionReportData({
                    reportedBy: userId,
                    reportedUser: userId
                })
            )
        )

        expect(hasFieldError(error, "reportedUser")).toBe(true)
        expect(error.errors.reportedUser.message).toBe(
            "Reporting and reported users must be different users"
        )

    })


    // REASON


    test("Reason is required", async () => {

        const data = createSessionReportData()

        delete data.reason

        const error = await getValidationError(new Report(data))

        expect(hasFieldError(error, "reason")).toBe(true)

    })


    test("Reason is trimmed and immutable", () => {

        const report = new Report(
            createSessionReportData({
                reason: "   Inappropriate behavior   "
            })
        )

        expect(report.reason).toBe("Inappropriate behavior")
        expect(Report.schema.path("reason").options.immutable).toBe(true)

    })


    test("Reason longer than 1000 characters is rejected", async () => {

        const error = await getValidationError(
            new Report(
                createSessionReportData({
                    reason: "a".repeat(1001)
                })
            )
        )

        expect(hasFieldError(error, "reason")).toBe(true)

    })


    // STATUS AND ADMIN RESPONSE


    test("Status defaults to PENDING", () => {

        const report = new Report(createSessionReportData())

        expect(report.status).toBe(REPORT_STATUSES.PENDING)

    })


    test("All Report statuses are accepted", async () => {

        for(const status of Object.values(REPORT_STATUSES)){

            const report = new Report(
                createSessionReportData({status})
            )

            await expect(report.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid Report status is rejected", async () => {

        const error = await getValidationError(
            new Report(
                createSessionReportData({
                    status: "CLOSED"
                })
            )
        )

        expect(hasFieldError(error, "status")).toBe(true)

    })


    test("Admin response defaults to null", () => {

        const report = new Report(createSessionReportData())

        expect(report.adminResponse).toBeNull()

    })


    test("Pending Report rejects admin response", async () => {

        const error = await getValidationError(
            new Report(
                createSessionReportData({
                    adminResponse: "Reviewed"
                })
            )
        )

        expect(hasFieldError(error, "adminResponse")).toBe(true)

    })


    test("Resolved and dismissed Reports accept admin response", async () => {

        for(const status of [
            REPORT_STATUSES.RESOLVED,
            REPORT_STATUSES.DISMISSED
        ]){

            const report = new Report(
                createSessionReportData({
                    status,
                    adminResponse: "   Reviewed by admin   "
                })
            )

            await expect(report.validate()).resolves.toBeUndefined()
            expect(report.adminResponse).toBe("Reviewed by admin")

        }

    })


    test("Empty or long admin response is rejected", async () => {

        for(const adminResponse of ["   ", "a".repeat(501)]){

            const error = await getValidationError(
                new Report(
                    createSessionReportData({
                        status: REPORT_STATUSES.RESOLVED,
                        adminResponse
                    })
                )
            )

            expect(hasFieldError(error, "adminResponse")).toBe(true)

        }

    })


    // INDEXES


    test("Report has unique partial Session reporter index", () => {

        const reportIndex = Report.schema.indexes().find(
            ([fields]) =>
                fields.session === 1 &&
                fields.reportedBy === 1
        )

        expect(reportIndex).toBeDefined()
        expect(reportIndex[1].unique).toBe(true)
        expect(reportIndex[1].partialFilterExpression).toBeDefined()

    })


    test("Report has unique partial Message reporter index", () => {

        const reportIndex = Report.schema.indexes().find(
            ([fields]) =>
                fields.message === 1 &&
                fields.reportedBy === 1
        )

        expect(reportIndex).toBeDefined()
        expect(reportIndex[1].unique).toBe(true)
        expect(reportIndex[1].partialFilterExpression).toBeDefined()

    })


    test("Report has reporter and status pagination indexes", () => {

        const indexes = Report.schema.indexes()

        const reporterIndex = indexes.find(
            ([fields]) =>
                fields.reportedBy === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        const statusIndex = indexes.find(
            ([fields]) =>
                fields.status === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(reporterIndex).toBeDefined()
        expect(statusIndex).toBeDefined()

    })


    test("Report schema has timestamps enabled", () => {

        expect(Report.schema.options.timestamps).toBe(true)

    })

})
