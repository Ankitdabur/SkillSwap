import { jest } from "@jest/globals"
import {
    validateAcceptSession,
    validateCreateSession,
    validateGetSessionsByStatus,
    validateRejectSession,
    validateSessionId
} from "../../../src/modules/sessions/session.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../../src/constants/enums.js"


describe("Session Validation", () => {

    const loggedInUserId = "507f1f77bcf86cd799439011"
    const teacherId = "507f1f77bcf86cd799439012"
    const skillId = "507f1f77bcf86cd799439013"
    const sessionId = "507f1f77bcf86cd799439014"


    const getFutureSchedule = () => {

        const futureDate = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        )

        const parts = new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23"
            }
        ).formatToParts(futureDate)

        const getPart = (type) => parts.find(
            (part) => part.type === type
        ).value

        return {
            date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
            time: `${getPart("hour")}:${getPart("minute")}`
        }
    }


    const createSessionRequest = (overrides = {}) => ({
        teacherId,
        skillId,
        ...getFutureSchedule(),
        duration: SESSION_DURATIONS.ONE_HOUR,
        sessionType: SESSION_TYPES.REGULAR,
        credits: 10,
        ...overrides
    })


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // CREATE SESSION


    test("Create Session validation accepts correct Regular Session", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest()
        }

        const next = jest.fn()

        validateCreateSession(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(req.sessionData).toEqual(
            expect.objectContaining({
                teacherId,
                skillId,
                duration: SESSION_DURATIONS.ONE_HOUR,
                sessionType: SESSION_TYPES.REGULAR,
                credits: 10,
                scheduledAt: expect.any(Date)
            })
        )

    })


    test("Create Session validation interprets date and time as IST", () => {

        const schedule = getFutureSchedule()

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest(schedule)
        }

        const next = jest.fn()

        validateCreateSession(req, {}, next)

        expect(req.sessionData.scheduledAt.toISOString()).toBe(
            new Date(
                `${schedule.date}T${schedule.time}:00+05:30`
            ).toISOString()
        )

    })


    test("Create Session validation accepts Demo Session with zero credits", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({
                sessionType: SESSION_TYPES.DEMO,
                credits: 0
            })
        }

        const next = jest.fn()

        validateCreateSession(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create Session validation rejects unknown field", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({status: SESSION_STATUSES.ACCEPTED})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects missing body fields", () => {

        const req = {
            user: {
                _id: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teacherId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "skillId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "date",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "time",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "duration",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "sessionType",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "credits",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid teacher id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({teacherId: "invalid-teacher-id"})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teacherId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects learner as teacher", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({teacherId: loggedInUserId})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teacherId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid skill id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({skillId: "invalid-skill-id"})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "skillId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid calendar date", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({date: "2026-02-30"})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "date",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects past date and time", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({
                date: "2020-01-01",
                time: "10:00"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "date",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid time", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({time: "24:00"})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "time",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid duration", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({duration: 15})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "duration",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects invalid Session type", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({sessionType: "INVALID_SESSION_TYPE"})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "sessionType",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects fractional credits", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({credits: 1.5})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "credits",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects nonzero Demo credits", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({
                sessionType: SESSION_TYPES.DEMO,
                credits: 5
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "credits",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create Session validation rejects nonpositive Regular credits", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: createSessionRequest({credits: 0})
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "credits",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // GET SESSIONS BY STATUS


    test("Get Sessions validation accepts status with default pagination", () => {

        const req = {
            params: {
                status: "pending"
            },
            query: {}
        }

        const next = jest.fn()

        validateGetSessionsByStatus(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(req.sessionListQuery).toEqual({
            status: SESSION_STATUSES.PENDING,
            cursor: null,
            limit: 10
        })

    })


    test("Get Sessions validation maps completion-pending status", () => {

        const req = {
            params: {
                status: "completion-pending"
            },
            query: {}
        }

        const next = jest.fn()

        validateGetSessionsByStatus(req, {}, next)

        expect(req.sessionListQuery.status).toBe(
            SESSION_STATUSES.COMPLETION_PENDING
        )

    })


    test("Get Sessions validation accepts cursor and limit", () => {

        const req = {
            params: {
                status: "accepted"
            },
            query: {
                cursor: sessionId,
                limit: "20"
            }
        }

        const next = jest.fn()

        validateGetSessionsByStatus(req, {}, next)

        expect(req.sessionListQuery).toEqual({
            status: SESSION_STATUSES.ACCEPTED,
            cursor: sessionId,
            limit: 20
        })

    })


    test("Get Sessions validation rejects invalid status", () => {

        const req = {
            params: {
                status: "under-review"
            },
            query: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSessionsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get Sessions validation rejects uppercase status", () => {

        const req = {
            params: {
                status: "PENDING"
            },
            query: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSessionsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get Sessions validation rejects unknown query field", () => {

        const req = {
            params: {
                status: "pending"
            },
            query: {
                page: "1"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSessionsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "page",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get Sessions validation rejects invalid cursor", () => {

        const req = {
            params: {
                status: "pending"
            },
            query: {
                cursor: "invalid-session-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSessionsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "cursor",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get Sessions validation rejects invalid limit", () => {

        const req = {
            params: {
                status: "pending"
            },
            query: {
                limit: "51"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSessionsByStatus,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "limit",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // SESSION ID


    test("Session id validation accepts valid Session id", () => {

        const req = {
            params: {
                sessionId
            }
        }

        const next = jest.fn()

        validateSessionId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Session id validation rejects invalid Session id", () => {

        const req = {
            params: {
                sessionId: "invalid-session-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSessionId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Session id validation rejects missing Session id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSessionId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // ACCEPT SESSION


    test("Accept Session validation accepts HTTPS meeting link and teacher response", () => {

        const req = {
            body: {
                meetingLink: "   https://meet.example.com/session   ",
                teacherResponse: "   Ready for the Session   "
            }
        }

        const next = jest.fn()

        validateAcceptSession(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(req.sessionAcceptanceData).toEqual({
            meetingLink: "https://meet.example.com/session",
            teacherResponse: "Ready for the Session"
        })

    })


    test("Accept Session validation accepts missing teacher response", () => {

        const req = {
            body: {
                meetingLink: "https://meet.example.com/session"
            }
        }

        const next = jest.fn()

        validateAcceptSession(req, {}, next)

        expect(req.sessionAcceptanceData.teacherResponse).toBeNull()

    })


    test("Accept Session validation rejects unknown field", () => {

        const req = {
            body: {
                meetingLink: "https://meet.example.com/session",
                credits: 20
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAcceptSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "credits",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Accept Session validation rejects missing meeting link", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAcceptSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "meetingLink",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Accept Session validation rejects non-HTTPS meeting link", () => {

        const req = {
            body: {
                meetingLink: "http://meet.example.com/session"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAcceptSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "meetingLink",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Accept Session validation rejects invalid teacher response", () => {

        const req = {
            body: {
                meetingLink: "https://meet.example.com/session",
                teacherResponse: "a".repeat(501)
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAcceptSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teacherResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // REJECT SESSION


    test("Reject Session validation accepts missing teacher response", () => {

        const req = {}
        const next = jest.fn()

        validateRejectSession(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(req.sessionRejectionData.teacherResponse).toBeNull()

    })


    test("Reject Session validation accepts and trims teacher response", () => {

        const req = {
            body: {
                teacherResponse: "   Credit amount is too low   "
            }
        }

        const next = jest.fn()

        validateRejectSession(req, {}, next)

        expect(req.sessionRejectionData.teacherResponse).toBe(
            "Credit amount is too low"
        )

    })


    test("Reject Session validation rejects unknown field", () => {

        const req = {
            body: {
                status: SESSION_STATUSES.REJECTED
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateRejectSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "status",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Reject Session validation rejects invalid teacher response", () => {

        const req = {
            body: {
                teacherResponse: "   "
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateRejectSession,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teacherResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })

})
