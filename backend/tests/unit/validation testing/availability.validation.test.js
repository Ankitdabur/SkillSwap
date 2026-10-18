import { jest } from "@jest/globals";
import { validateUpdateAvailability } from "../../../src/modules/availability/availability.validation.js";
import { ERROR_CODES } from "../../../src/constants/errorCodes.js";


describe("Availability Validation", () => {

    const validAvailability = [
        {
            day: "MONDAY",
            startTime: "10:00",
            endTime: "12:00"
        }
    ]


    // CORRECT AVAILABILITY


    test("Update availability validation accepts correct availability", () => {

        const req = {
            body: {
                availability: validAvailability
            }
        }

        const res = {}
        const next = jest.fn()

        validateUpdateAvailability(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Update availability validation accepts adjacent availability slots", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    },
                    {
                        day: "MONDAY",
                        startTime: "12:00",
                        endTime: "14:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        validateUpdateAvailability(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Update availability validation accepts same times on different days", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    },
                    {
                        day: "TUESDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        validateUpdateAvailability(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    // REQUEST BODY


    test("Update availability validation rejects unknown request field", () => {

        const req = {
            body: {
                availability: validAvailability,
                userId: "507f1f77bcf86cd799439011"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "userId",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // AVAILABILITY ARRAY


    test("Update availability validation rejects missing availability", () => {

        const req = {
            body: {}
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects availability if it is not an array", () => {

        const req = {
            body: {
                availability: "MONDAY"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects empty availability array", () => {

        const req = {
            body: {
                availability: []
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects slot if it is not an object", () => {

        const req = {
            body: {
                availability: [null]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0]",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects unknown slot field", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00",
                        timezone: "Asia/Kolkata"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].timezone",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // DAY


    test("Update availability validation rejects missing day", () => {

        const req = {
            body: {
                availability: [
                    {
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].day",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects invalid day", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "FUNDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].day",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // START TIME


    test("Update availability validation rejects missing startTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].startTime",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects invalid startTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "25:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].startTime",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // END TIME


    test("Update availability validation rejects missing endTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].endTime",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects invalid endTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "24:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].endTime",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // TIME RANGE


    test("Update availability validation rejects endTime earlier than startTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "12:00",
                        endTime: "10:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].endTime",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects equal startTime and endTime", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "10:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[0].endTime",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // DUPLICATE AND OVERLAPPING SLOTS


    test("Update availability validation rejects duplicate slots", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    },
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[1]",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects when previous startTime is between current slot", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "11:00",
                        endTime: "13:00"
                    },
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[1]",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects when previous endTime is between current slot", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "09:00",
                        endTime: "11:00"
                    },
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[1]",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Update availability validation rejects when previous slot contains current slot", () => {

        const req = {
            body: {
                availability: [
                    {
                        day: "MONDAY",
                        startTime: "09:00",
                        endTime: "13:00"
                    },
                    {
                        day: "MONDAY",
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateUpdateAvailability(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "availability[1]",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })

})
