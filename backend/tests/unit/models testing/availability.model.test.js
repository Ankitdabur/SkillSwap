import mongoose from "mongoose"
import Availability from "../../../src/models/availability.model.js"
import {DAYS_OF_WEEK} from "../../../src/constants/enums.js"


describe("Availability Model", () => {

    const createAvailabilityData = (overrides = {}) => ({
        userId: new mongoose.Types.ObjectId(),
        startTime: "10:00",
        endTime: "12:00",
        day: DAYS_OF_WEEK.MONDAY,
        ...overrides
    })


    const getValidationError = async (availability) => {

        try {
            await availability.validate()
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


    // VALID AVAILABILITY


    test("Valid availability passes validation", async () => {

        const availability = new Availability(createAvailabilityData())

        await expect(availability.validate()).resolves.toBeUndefined()

    })


    // USER ID


    test("User id is required", async () => {

        const data = createAvailabilityData()

        delete data.userId

        const availability = new Availability(data)

        const error = await getValidationError(availability)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "userId")).toBe(true)

    })


    test("User id references the User model", () => {

        const userIdPath = Availability.schema.path("userId")

        expect(userIdPath.options.ref).toBe("User")

    })


    // DAY


    test("Day is required", async () => {

        const data = createAvailabilityData()

        delete data.day

        const availability = new Availability(data)

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "day")).toBe(true)

    })


    test("Finalized days of week are accepted", async () => {

        for (const day of Object.values(DAYS_OF_WEEK)) {

            const availability = new Availability(
                createAvailabilityData({ day })
            )

            await expect(availability.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid day is rejected", async () => {

        const availability = new Availability(
            createAvailabilityData({
                day: "INVALID_DAY"
            })
        )

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "day")).toBe(true)

    })


    // START TIME


    test("Start time is required", async () => {

        const data = createAvailabilityData()

        delete data.startTime

        const availability = new Availability(data)

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "startTime")).toBe(true)

    })


    test("Start time accepts valid HH:mm format", async () => {

        const availability = new Availability(
            createAvailabilityData({
                startTime: "09:30"
            })
        )

        await expect(
            availability.validate()
        ).resolves.toBeUndefined()

    })


    test("Start time rejects invalid HH:mm format", async () => {

        const availability = new Availability(
            createAvailabilityData({
                startTime: "9:30"
            })
        )

        const error = await getValidationError(availability)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "startTime")).toBe(true)

    })


    // END TIME


    test("End time is required", async () => {

        const data = createAvailabilityData()

        delete data.endTime

        const availability = new Availability(data)

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "endTime")).toBe(true)

    })


    test("End time accepts valid HH:mm format", async () => {

        const availability = new Availability(
            createAvailabilityData({
                endTime: "23:59"
            })
        )

        await expect(
            availability.validate()
        ).resolves.toBeUndefined()

    })


    test("End time rejects invalid HH:mm format", async () => {

        const availability = new Availability(
            createAvailabilityData({
                endTime: "24:00"
            })
        )

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "endTime")).toBe(true)

    })


    test("End time earlier than start time is rejected", async () => {

        const availability = new Availability(
            createAvailabilityData({
                startTime: "12:00",
                endTime: "10:00"
            })
        )

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "endTime")).toBe(true)
        expect(error.errors.endTime.message).toBe("Invalid slot")

    })


    test("Equal start and end times are rejected", async () => {

        const availability = new Availability(
            createAvailabilityData({
                startTime: "10:00",
                endTime: "10:00"
            })
        )

        const error = await getValidationError(
            availability
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "endTime")).toBe(true)
        expect(error.errors.endTime.message).toBe("Invalid slot")

    })


    // INDEX


    test("Availability has a unique compound slot index", () => {

        const indexes = Availability.schema.indexes()

        const slotIndex = indexes.find(
            ([fields]) =>
                fields.userId === 1 &&
                fields.day === 1 &&
                fields.startTime === 1 &&
                fields.endTime === 1
        )

        expect(slotIndex).toBeDefined()
        expect(slotIndex[1].unique).toBe(true)

    })


    // TIMESTAMPS


    test("Availability schema has timestamps enabled", () => {

        expect(
            Availability.schema.options.timestamps
        ).toBe(true)

    })

})
