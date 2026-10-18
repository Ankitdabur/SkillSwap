import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Availability from "../../../src/models/availability.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import { DAYS_OF_WEEK } from "../../../src/constants/enums.js"
import {
    createTestLearner,
    createTestTeacher
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestAvailability,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const CURRENT_AVAILABILITY_URL = `http://localhost:${PORT}/api/v1/availability/me`

let server


const getCurrentAvailabilityRequest = async (accessToken) => {
    try {
        return await axios.get(
            CURRENT_AVAILABILITY_URL,
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
    await cleanupTestAvailability()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestAvailability()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get Current Availability", () => {

    test("Logged in user can get current availability", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        await Availability.create({
            userId: user._id,
            day: DAYS_OF_WEEK.MONDAY,
            startTime: "10:00",
            endTime: "12:00"
        })

        await Availability.create({
            userId: user._id,
            day: DAYS_OF_WEEK.TUESDAY,
            startTime: "14:00",
            endTime: "16:00"
        })

        const response = await getCurrentAvailabilityRequest(
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "current user availability fetched successfully"
        )
        expect(response.data.data.availability).toHaveLength(2)

        expect(
            response.data.data.availability.map((slot) => slot.day)
        ).toEqual(
            expect.arrayContaining([
                DAYS_OF_WEEK.MONDAY,
                DAYS_OF_WEEK.TUESDAY
            ])
        )

        response.data.data.availability.forEach((slot) => {
            expect(slot.userId).toBe(user._id.toString())
        })
    })


    test("User receives only their own availability", async () => {
        const { user: learner } = await createTestLearner()
        const { user: teacher } = await createTestTeacher()
        const accessToken = generateAccessToken(learner._id)

        await Availability.create({
            userId: learner._id,
            day: DAYS_OF_WEEK.MONDAY,
            startTime: "10:00",
            endTime: "12:00"
        })

        await Availability.create({
            userId: teacher._id,
            day: DAYS_OF_WEEK.FRIDAY,
            startTime: "15:00",
            endTime: "17:00"
        })

        const response = await getCurrentAvailabilityRequest(
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.availability).toHaveLength(1)
        expect(response.data.data.availability[0].userId).toBe(
            learner._id.toString()
        )
        expect(response.data.data.availability[0].day).toBe(
            DAYS_OF_WEEK.MONDAY
        )
    })


    test("User cannot get current availability without access token", async () => {
        await createTestLearner()

        const response = await getCurrentAvailabilityRequest()

        expect(response.status).toBe(401)
    })


    test("User cannot get current availability with invalid access token", async () => {
        await createTestLearner()

        const response = await getCurrentAvailabilityRequest(
            "invalid-access-token"
        )

        expect(response.status).toBe(401)
    })

})
