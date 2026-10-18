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
const UPDATE_AVAILABILITY_URL = `http://localhost:${PORT}/api/v1/availability/me`

let server


const updateAvailabilityRequest = async (body, accessToken) => {
    try {
        return await axios.put(
            UPDATE_AVAILABILITY_URL,
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
    await cleanupTestAvailability()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestAvailability()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Update Availability", () => {

    test("Logged in user can replace complete availability", async () => {
        const { user } = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const oldAvailability = await Availability.create([
            {
                userId: user._id,
                day: DAYS_OF_WEEK.MONDAY,
                startTime: "10:00",
                endTime: "12:00"
            },
            {
                userId: user._id,
                day: DAYS_OF_WEEK.TUESDAY,
                startTime: "14:00",
                endTime: "16:00"
            }
        ])

        const newAvailability = [
            {
                day: DAYS_OF_WEEK.WEDNESDAY,
                startTime: "09:00",
                endTime: "11:00"
            },
            {
                day: DAYS_OF_WEEK.WEDNESDAY,
                startTime: "11:00",
                endTime: "13:00"
            }
        ]

        const response = await updateAvailabilityRequest(
            {
                availability: newAvailability
            },
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.message).toBe(
            "user availability updated successfully"
        )
        expect(response.data.data.availability).toHaveLength(
            newAvailability.length
        )

        const savedAvailability = await Availability.find({
            userId: user._id
        })

        expect(savedAvailability).toHaveLength(
            newAvailability.length
        )

        expect(
            savedAvailability.map((slot) => slot.day)
        ).toEqual([
            DAYS_OF_WEEK.WEDNESDAY,
            DAYS_OF_WEEK.WEDNESDAY
        ])

        const oldAvailabilityIds = oldAvailability.map(
            (slot) => slot._id.toString()
        )

        savedAvailability.forEach((slot) => {
            expect(oldAvailabilityIds).not.toContain(
                slot._id.toString()
            )
            expect(slot.userId.equals(user._id)).toBe(true)
        })
    })


    test("Updating availability does not change another user availability", async () => {
        const { user: learner } = await createTestLearner()
        const { user: teacher } = await createTestTeacher()
        const accessToken = generateAccessToken(learner._id)

        await Availability.create({
            userId: learner._id,
            day: DAYS_OF_WEEK.MONDAY,
            startTime: "10:00",
            endTime: "12:00"
        })

        const teacherAvailability = await Availability.create({
            userId: teacher._id,
            day: DAYS_OF_WEEK.FRIDAY,
            startTime: "15:00",
            endTime: "17:00"
        })

        const response = await updateAvailabilityRequest(
            {
                availability: [
                    {
                        day: DAYS_OF_WEEK.THURSDAY,
                        startTime: "08:00",
                        endTime: "10:00"
                    }
                ]
            },
            accessToken
        )

        expect(response.status).toBe(200)

        const savedTeacherAvailability = await Availability.find({
            userId: teacher._id
        })

        expect(savedTeacherAvailability).toHaveLength(1)
        expect(savedTeacherAvailability[0]._id.equals(
            teacherAvailability._id
        )).toBe(true)
        expect(savedTeacherAvailability[0].day).toBe(
            DAYS_OF_WEEK.FRIDAY
        )
    })


    test("User cannot update availability without access token", async () => {
        await createTestLearner()

        const response = await updateAvailabilityRequest({
            availability: [
                {
                    day: DAYS_OF_WEEK.MONDAY,
                    startTime: "10:00",
                    endTime: "12:00"
                }
            ]
        })

        expect(response.status).toBe(401)
    })


    test("User cannot update availability with invalid access token", async () => {
        await createTestLearner()

        const response = await updateAvailabilityRequest(
            {
                availability: [
                    {
                        day: DAYS_OF_WEEK.MONDAY,
                        startTime: "10:00",
                        endTime: "12:00"
                    }
                ]
            },
            "invalid-access-token"
        )

        expect(response.status).toBe(401)
    })

})
