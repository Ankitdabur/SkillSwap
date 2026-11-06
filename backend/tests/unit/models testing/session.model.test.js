import mongoose from "mongoose"
import Session from "../../../src/models/session.model.js"
import {
    COMPLETION_METHODS,
    SESSION_COMPLETION_RESPONSES,
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../../src/constants/enums.js"


describe("Session Model", () => {

    const createSessionData = (overrides = {}) => ({
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: SESSION_DURATIONS.ONE_HOUR,
        credits: 10,
        teacher: new mongoose.Types.ObjectId(),
        learner: new mongoose.Types.ObjectId(),
        skill: new mongoose.Types.ObjectId(),
        ...overrides
    })


    const getValidationError = async (session) => {

        try {
            await session.validate()
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


    // VALID SESSION


    test("Valid Session passes validation", async () => {

        const session = new Session(createSessionData())

        await expect(session.validate()).resolves.toBeUndefined()

    })


    // RECURRING SCHEDULE


    test("Recurring schedule defaults to null", () => {

        const session = new Session(createSessionData())

        expect(session.recurringSchedule).toBeNull()

    })


    test("Recurring schedule references the RecurringSchedule model and is immutable", () => {

        const recurringSchedulePath = Session.schema.path("recurringSchedule")

        expect(recurringSchedulePath.options.ref).toBe("RecurringSchedule")
        expect(recurringSchedulePath.options.immutable).toBe(true)

    })


    // SCHEDULED AT


    test("Scheduled at is required", async () => {

        const data = createSessionData()

        delete data.scheduledAt

        const error = await getValidationError(new Session(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "scheduledAt")).toBe(true)

    })


    test("Past scheduled at is rejected for a new Session", async () => {

        const session = new Session(
            createSessionData({
                scheduledAt: new Date(Date.now() - 60 * 1000)
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "scheduledAt")).toBe(true)

    })


    test("Scheduled at is immutable", () => {

        expect(
            Session.schema.path("scheduledAt").options.immutable
        ).toBe(true)

    })


    // DURATION


    test("Duration is required", async () => {

        const data = createSessionData()

        delete data.duration

        const error = await getValidationError(new Session(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "duration")).toBe(true)

    })


    test("Finalized Session durations are accepted", async () => {

        for(const duration of Object.values(SESSION_DURATIONS)){

            const session = new Session(
                createSessionData({duration})
            )

            await expect(session.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid duration is rejected", async () => {

        const session = new Session(
            createSessionData({duration: 15})
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "duration")).toBe(true)

    })


    test("Duration is immutable", () => {

        expect(
            Session.schema.path("duration").options.immutable
        ).toBe(true)

    })


    // CREDITS


    test("Credits are required", async () => {

        const data = createSessionData()

        delete data.credits

        const error = await getValidationError(new Session(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "credits")).toBe(true)

    })


    test("Regular Session accepts positive whole-number credits", async () => {

        const session = new Session(
            createSessionData({
                sessionType: SESSION_TYPES.REGULAR,
                credits: 5
            })
        )

        await expect(session.validate()).resolves.toBeUndefined()

    })


    test("Regular Session rejects zero credits", async () => {

        const session = new Session(
            createSessionData({
                sessionType: SESSION_TYPES.REGULAR,
                credits: 0
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "credits")).toBe(true)

    })


    test("Demo Session accepts zero credits", async () => {

        const session = new Session(
            createSessionData({
                sessionType: SESSION_TYPES.DEMO,
                credits: 0
            })
        )

        await expect(session.validate()).resolves.toBeUndefined()

    })


    test("Demo Session rejects positive credits", async () => {

        const session = new Session(
            createSessionData({
                sessionType: SESSION_TYPES.DEMO,
                credits: 5
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "credits")).toBe(true)

    })


    test("Fractional credits are rejected", async () => {

        const session = new Session(
            createSessionData({credits: 1.5})
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "credits")).toBe(true)

    })


    test("Credits are immutable", () => {

        expect(
            Session.schema.path("credits").options.immutable
        ).toBe(true)

    })


    // TEACHER RESPONSE


    test("Teacher response defaults to null", () => {

        const session = new Session(createSessionData())

        expect(session.teacherResponse).toBeNull()

    })


    test("Teacher response is trimmed", () => {

        const session = new Session(
            createSessionData({
                teacherResponse: "   Ready for the Session   "
            })
        )

        expect(session.teacherResponse).toBe("Ready for the Session")

    })


    test("Teacher response longer than 500 characters is rejected", async () => {

        const session = new Session(
            createSessionData({
                teacherResponse: "a".repeat(501)
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teacherResponse")).toBe(true)

    })


    // STATUS


    test("Status defaults to PENDING", () => {

        const session = new Session(createSessionData())

        expect(session.status).toBe(SESSION_STATUSES.PENDING)

    })


    test("Finalized Session statuses are accepted", async () => {

        for(const status of Object.values(SESSION_STATUSES)){

            const data = createSessionData({status})

            if(![
                SESSION_STATUSES.PENDING,
                SESSION_STATUSES.REJECTED
            ].includes(status)){
                data.meetingLink = "https://meet.example.com/session"
            }

            if(status === SESSION_STATUSES.COMPLETED){
                data.completionMethod = COMPLETION_METHODS.ADMIN
            }

            const session = new Session(data)

            await expect(session.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid status is rejected", async () => {

        const session = new Session(
            createSessionData({status: "INVALID_STATUS"})
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "status")).toBe(true)

    })


    // SESSION TYPE


    test("Session type defaults to REGULAR", () => {

        const session = new Session(createSessionData())

        expect(session.sessionType).toBe(SESSION_TYPES.REGULAR)

    })


    test("Finalized Session types are accepted", async () => {

        for(const sessionType of Object.values(SESSION_TYPES)){

            const session = new Session(
                createSessionData({
                    sessionType,
                    credits: sessionType === SESSION_TYPES.DEMO ? 0 : 10
                })
            )

            await expect(session.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid Session type is rejected", async () => {

        const session = new Session(
            createSessionData({sessionType: "INVALID_SESSION_TYPE"})
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "sessionType")).toBe(true)

    })


    test("Session type is immutable", () => {

        expect(
            Session.schema.path("sessionType").options.immutable
        ).toBe(true)

    })


    // MEETING LINK


    test("Meeting link defaults to null for pending Session", () => {

        const session = new Session(createSessionData())

        expect(session.meetingLink).toBeNull()

    })


    test("Accepted Session requires meeting link", async () => {

        const session = new Session(
            createSessionData({status: SESSION_STATUSES.ACCEPTED})
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "meetingLink")).toBe(true)

    })


    test("Valid HTTPS meeting link is accepted and trimmed", async () => {

        const session = new Session(
            createSessionData({
                status: SESSION_STATUSES.ACCEPTED,
                meetingLink: "   https://meet.example.com/session   "
            })
        )

        await expect(session.validate()).resolves.toBeUndefined()
        expect(session.meetingLink).toBe("https://meet.example.com/session")

    })


    test("Non-HTTPS meeting link is rejected", async () => {

        const session = new Session(
            createSessionData({
                status: SESSION_STATUSES.ACCEPTED,
                meetingLink: "http://meet.example.com/session"
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "meetingLink")).toBe(true)

    })


    // COMPLETION METHOD


    test("Completion method defaults to null", () => {

        const session = new Session(createSessionData())

        expect(session.completionMethod).toBeNull()

    })


    test("Completed Session requires completion method", async () => {

        const session = new Session(
            createSessionData({
                status: SESSION_STATUSES.COMPLETED,
                meetingLink: "https://meet.example.com/session"
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "completionMethod")).toBe(true)

    })


    test("Finalized completion methods are accepted for completed Session", async () => {

        for(const completionMethod of Object.values(COMPLETION_METHODS)){

            const session = new Session(
                createSessionData({
                    status: SESSION_STATUSES.COMPLETED,
                    meetingLink: "https://meet.example.com/session",
                    completionMethod
                })
            )

            await expect(session.validate()).resolves.toBeUndefined()

        }

    })


    test("Completion method is rejected before Session completion", async () => {

        const session = new Session(
            createSessionData({
                completionMethod: COMPLETION_METHODS.ADMIN
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "completionMethod")).toBe(true)

    })


    // COMPLETION RESPONSES


    test("Completion responses and response times default to null", () => {

        const session = new Session(createSessionData())

        expect(session.teacherCompletionResponse).toBeNull()
        expect(session.teacherRespondedAt).toBeNull()
        expect(session.learnerCompletionResponse).toBeNull()
        expect(session.learnerRespondedAt).toBeNull()

    })


    test("Teacher cannot submit a dispute response", async () => {

        const session = new Session(
            createSessionData({
                teacherCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.DISPUTE
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(
            hasFieldError(error, "teacherCompletionResponse")
        ).toBe(true)

    })


    test("Learner can submit a dispute response", async () => {

        const session = new Session(
            createSessionData({
                learnerCompletionResponse:
                    SESSION_COMPLETION_RESPONSES.DISPUTE,
                learnerRespondedAt: new Date()
            })
        )

        await expect(session.validate()).resolves.toBeUndefined()

    })


    // PARTICIPANTS AND SKILL


    test("Teacher learner and skill are required", async () => {

        const data = createSessionData()

        delete data.teacher
        delete data.learner
        delete data.skill

        const error = await getValidationError(new Session(data))

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teacher")).toBe(true)
        expect(hasFieldError(error, "learner")).toBe(true)
        expect(hasFieldError(error, "skill")).toBe(true)

    })


    test("Teacher and learner must be different users", async () => {

        const userId = new mongoose.Types.ObjectId()

        const session = new Session(
            createSessionData({
                teacher: userId,
                learner: userId
            })
        )

        const error = await getValidationError(session)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "learner")).toBe(true)

    })


    test("Participant and skill references are configured", () => {

        expect(Session.schema.path("teacher").options.ref).toBe("User")
        expect(Session.schema.path("learner").options.ref).toBe("User")
        expect(Session.schema.path("skill").options.ref).toBe("Skill")

    })


    test("Participant and skill fields are immutable", () => {

        expect(Session.schema.path("teacher").options.immutable).toBe(true)
        expect(Session.schema.path("learner").options.immutable).toBe(true)
        expect(Session.schema.path("skill").options.immutable).toBe(true)

    })


    // INDEXES


    test("Session has finalized indexes", () => {

        const indexes = Session.schema.indexes()

        const expectedIndexes = [
            {
                teacher: 1,
                scheduledAt: 1
            },
            {
                learner: 1,
                scheduledAt: 1
            },
            {
                status: 1,
                scheduledAt: 1
            },
            {
                recurringSchedule: 1,
                scheduledAt: 1
            },
            {
                teacher: 1,
                skill: 1,
                sessionType: 1,
                status: 1
            }
        ]

        expectedIndexes.forEach((expectedIndex) => {
            const index = indexes.find(
                ([fields]) =>
                    Object.keys(expectedIndex).every(
                        (field) => fields[field] === expectedIndex[field]
                    )
            )

            expect(index).toBeDefined()
        })

    })


    // TIMESTAMPS


    test("Session schema has timestamps enabled", () => {

        expect(Session.schema.options.timestamps).toBe(true)

    })

})
