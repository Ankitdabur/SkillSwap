import { jest } from "@jest/globals"
import {
    validateSendMessage,
    validateMessageUserId,
    validateGetConversationMessages,
    validateMessageId
} from "../../../src/modules/messages/message.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Message Validation", () => {

    const loggedInUserId = "507f1f77bcf86cd799439011"
    const otherUserId = "507f1f77bcf86cd799439012"
    const messageId = "507f1f77bcf86cd799439013"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // SEND MESSAGE


    test("Send Message validation accepts correct data", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                content: "Test message"
            }
        }

        const next = jest.fn()

        validateSendMessage(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Send Message validation trims content", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                content: "   Test message   "
            }
        }

        const next = jest.fn()

        validateSendMessage(req, {}, next)

        expect(req.body.content).toBe("Test message")
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Send Message validation rejects unknown field", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                content: "Test message",
                messageType: "AI_SUMMARY"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "messageType",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects missing receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                content: "Test message"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects invalid receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: "invalid-user-id",
                content: "Test message"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects non-string receiver id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: 123,
                content: "Test message"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects sending to logged-in user", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: loggedInUserId,
                content: "Test message"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects missing content", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "content",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects empty content", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                content: "   "
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "content",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects non-string content", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            body: {
                receiverId: otherUserId,
                content: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "content",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Send Message validation rejects missing body", () => {

        const req = {
            user: {
                _id: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSendMessage,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "receiverId",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "content",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // MESSAGE USER ID


    test("Message user id validation accepts valid user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: otherUserId
            }
        }

        const next = jest.fn()

        validateMessageUserId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Message user id validation rejects missing user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Message user id validation rejects invalid user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: "invalid-user-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Message user id validation rejects non-string user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Message user id validation rejects logged-in user id", () => {

        const req = {
            user: {
                _id: loggedInUserId
            },
            params: {
                userId: loggedInUserId
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageUserId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // GET CONVERSATION MESSAGES


    test("Get conversation validation applies default pagination", () => {

        const req = {}

        const next = jest.fn()

        validateGetConversationMessages(req, {}, next)

        expect(req.messagePagination).toEqual({
            cursor: null,
            limit: 20,
            direction: "older"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get conversation validation accepts cursor limit and older direction", () => {

        const req = {
            query: {
                cursor: messageId,
                limit: "25",
                direction: "older"
            }
        }

        const next = jest.fn()

        validateGetConversationMessages(req, {}, next)

        expect(req.messagePagination).toEqual({
            cursor: messageId,
            limit: 25,
            direction: "older"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get conversation validation accepts newer direction", () => {

        const req = {
            query: {
                cursor: messageId,
                direction: "newer"
            }
        }

        const next = jest.fn()

        validateGetConversationMessages(req, {}, next)

        expect(req.messagePagination).toEqual({
            cursor: messageId,
            limit: 20,
            direction: "newer"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get conversation validation accepts maximum limit", () => {

        const req = {
            query: {
                limit: "50"
            }
        }

        const next = jest.fn()

        validateGetConversationMessages(req, {}, next)

        expect(req.messagePagination).toEqual({
            cursor: null,
            limit: 50,
            direction: "older"
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get conversation validation rejects unknown query field", () => {

        const req = {
            query: {
                page: "1"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-message-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects non-string cursor", () => {

        const req = {
            query: {
                cursor: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects zero limit", () => {

        const req = {
            query: {
                limit: "0"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects limit above maximum", () => {

        const req = {
            query: {
                limit: "51"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects non-string limit", () => {

        const req = {
            query: {
                limit: 20
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
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


    test("Get conversation validation rejects invalid direction", () => {

        const req = {
            query: {
                cursor: messageId,
                direction: "invalid-direction"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "direction",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get conversation validation rejects non-string direction", () => {

        const req = {
            query: {
                cursor: messageId,
                direction: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "direction",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Get conversation validation rejects direction without cursor", () => {

        const req = {
            query: {
                direction: "newer"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetConversationMessages,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "direction",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // MESSAGE ID


    test("Message id validation accepts valid Message id", () => {

        const req = {
            params: {
                messageId
            }
        }

        const next = jest.fn()

        validateMessageId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Message id validation rejects missing Message id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Message id validation rejects invalid Message id", () => {

        const req = {
            params: {
                messageId: "invalid-message-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Message id validation rejects non-string Message id", () => {

        const req = {
            params: {
                messageId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateMessageId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })

})
