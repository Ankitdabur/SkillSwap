import { jest } from "@jest/globals"
import {
    validateGetNotifications,
    validateNotificationId
} from "../../../src/modules/notifications/notification.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"


describe("Notification Validation", () => {

    const notificationId = "507f1f77bcf86cd799439011"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // GET NOTIFICATIONS


    test("Get notifications validation accepts cursor pagination", () => {

        const req = {
            query: {
                cursor: notificationId,
                limit: "25"
            }
        }

        const next = jest.fn()

        validateGetNotifications(req, {}, next)

        expect(req.pagination).toEqual({
            cursor: notificationId,
            limit: 25
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get notifications validation applies default pagination", () => {

        const req = {}

        const next = jest.fn()

        validateGetNotifications(req, {}, next)

        expect(req.pagination).toEqual({
            cursor: null,
            limit: 20
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get notifications validation accepts maximum limit", () => {

        const req = {
            query: {
                limit: "50"
            }
        }

        const next = jest.fn()

        validateGetNotifications(req, {}, next)

        expect(req.pagination).toEqual({
            cursor: null,
            limit: 50
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get notifications validation rejects unknown query field", () => {

        const req = {
            query: {
                status: "unread"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-notification-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation rejects non-string cursor", () => {

        const req = {
            query: {
                cursor: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation rejects zero limit", () => {

        const req = {
            query: {
                limit: "0"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation rejects limit above maximum", () => {

        const req = {
            query: {
                limit: "51"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation rejects non-string limit", () => {

        const req = {
            query: {
                limit: 20
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
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


    test("Get notifications validation returns cursor and limit errors together", () => {

        const req = {
            query: {
                cursor: "invalid",
                limit: "invalid"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetNotifications,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "cursor",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "limit",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // NOTIFICATION ID


    test("Notification id validation accepts valid notification id", () => {

        const req = {
            params: {
                notificationId
            }
        }

        const next = jest.fn()

        validateNotificationId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Notification id validation rejects missing notification id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateNotificationId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Notification id validation rejects invalid notification id", () => {

        const req = {
            params: {
                notificationId: "invalid-notification-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateNotificationId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Notification id validation rejects non-string notification id", () => {

        const req = {
            params: {
                notificationId: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateNotificationId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })

})
