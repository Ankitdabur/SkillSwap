import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import Availability from "../../../src/models/availability.model.js"
import User from "../../../src/models/user.model.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    DAYS_OF_WEEK,
    MATCH_STATUSES,
    SESSION_STATUSES,
    TEACHING_STYLES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestMatch,
    createTestSession
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestAvailability,
    cleanupTestMatches,
    cleanupTestSessions,
    cleanupTestSkills,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const DISCOVERY_URL = `http://localhost:${PORT}/api/v1/discovery/teachers`

let server


const discoverTeachers = async (query, accessToken) => {
    try {
        return await axios.get(
            DISCOVERY_URL,
            {
                ...(accessToken ? authHeader(accessToken) : {}),
                params: query
            }
        )
    } catch (error) {
        return error.response
    }
}


const createDiscoveryUsers = async () => {
    const skill = await createTestSkill(
        "test-session-skill",
        "Test Session Skill"
    )

    const {user: learner} = await createTestLearner()
    const {user: teacher} = await createTestTeacher(skill._id)
    const {user: teacherLearner} = await createTestTeacherLearner(
        skill._id
    )

    return {
        skill,
        learner,
        teacher,
        teacherLearner
    }
}


beforeAll(async () => {
    await dbconnect()
    server = app.listen(PORT)
})


afterEach(async () => {
    await cleanupTestSessions()
    await cleanupTestMatches()
    await cleanupTestAvailability()
    await cleanupTestSkills()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestSessions()
    await cleanupTestMatches()
    await cleanupTestAvailability()
    await cleanupTestSkills()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Discover Teachers", () => {

    test("Learner can discover scored teachers in compatibility order", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createDiscoveryUsers()

        await User.findByIdAndUpdate(
            teacher._id,
            {
                rating: 5,
                totalReviews: 12
            }
        )

        await User.findByIdAndUpdate(
            teacherLearner._id,
            {
                rating: 4,
                totalReviews: 2
            }
        )

        await Availability.create([
            {
                userId: learner._id,
                day: DAYS_OF_WEEK.MONDAY,
                startTime: "10:00",
                endTime: "13:00"
            },
            {
                userId: teacher._id,
                day: DAYS_OF_WEEK.MONDAY,
                startTime: "10:00",
                endTime: "13:00"
            },
            {
                userId: teacherLearner._id,
                day: DAYS_OF_WEEK.MONDAY,
                startTime: "12:00",
                endTime: "13:00"
            }
        ], {
            ordered: true
        })

        for(let index = 0; index < 3; index += 1){
            await createTestSession(
                teacher._id,
                learner._id,
                skill._id,
                SESSION_STATUSES.COMPLETED,
                {
                    scheduledAt: new Date(
                        Date.now() + (index + 1) * 24 * 60 * 60 * 1000
                    )
                }
            )
        }

        const accessToken = generateAccessToken(learner._id)

        const response = await discoverTeachers(
            {
                skillId: skill._id.toString()
            },
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.data.scoredTeachers).toHaveLength(2)
        expect(response.data.data.scoredTeachers[0]._id).toBe(
            teacher._id.toString()
        )
        expect(
            response.data.data.scoredTeachers[0].overlapMinutes
        ).toBe(180)
        expect(
            response.data.data.scoredTeachers[0].scores
        ).toEqual({
            ratingScore: 100,
            availabilityScore: 100,
            experienceScore: 40,
            reviewScore: 60,
            compatibilityScore: 81
        })
        expect(
            response.data.data.scoredTeachers[1].scores.compatibilityScore
        ).toBe(36.5)
        expect(response.data.data.pagination).toEqual({
            page: 1,
            limit: 10,
            totalTeachers: 2,
            totalPages: 1
        })
    })


    test("Discovery filters teachers by optional teaching style", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createDiscoveryUsers()

        await User.findByIdAndUpdate(
            teacherLearner._id,
            {
                teachingStyles: [TEACHING_STYLES.HANDS_ON]
            }
        )

        const accessToken = generateAccessToken(learner._id)

        const response = await discoverTeachers(
            {
                skillId: skill._id.toString(),
                teachingStyle: TEACHING_STYLES.HANDS_ON
            },
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.scoredTeachers).toHaveLength(1)
        expect(response.data.data.scoredTeachers[0]._id).toBe(
            teacherLearner._id.toString()
        )
        expect(response.data.data.scoredTeachers[0]._id).not.toBe(
            teacher._id.toString()
        )
    })


    test("Discovery excludes a blocked teacher", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createDiscoveryUsers()

        await createTestMatch(
            learner._id,
            teacher._id,
            MATCH_STATUSES.BLOCKED,
            learner._id
        )

        const accessToken = generateAccessToken(learner._id)

        const response = await discoverTeachers(
            {
                skillId: skill._id.toString()
            },
            accessToken
        )

        const teacherIds = response.data.data.scoredTeachers.map(
            (discoveredTeacher) => discoveredTeacher._id
        )

        expect(response.status).toBe(200)
        expect(teacherIds).not.toContain(teacher._id.toString())
        expect(teacherIds).toContain(teacherLearner._id.toString())
    })


    test("Discovery applies page-based pagination", async () => {
        const {
            skill,
            learner,
            teacher,
            teacherLearner
        } = await createDiscoveryUsers()

        await User.findByIdAndUpdate(
            teacher._id,
            {
                rating: 5
            }
        )

        await User.findByIdAndUpdate(
            teacherLearner._id,
            {
                rating: 1
            }
        )

        const accessToken = generateAccessToken(learner._id)

        const response = await discoverTeachers(
            {
                skillId: skill._id.toString(),
                page: "2",
                limit: "1"
            },
            accessToken
        )

        expect(response.status).toBe(200)
        expect(response.data.data.scoredTeachers).toHaveLength(1)
        expect(response.data.data.scoredTeachers[0]._id).toBe(
            teacherLearner._id.toString()
        )
        expect(response.data.data.pagination).toEqual({
            page: 2,
            limit: 1,
            totalTeachers: 2,
            totalPages: 2
        })
    })


    test("Teaching-only account cannot use learner discovery", async () => {
        const {skill, teacher} = await createDiscoveryUsers()
        const accessToken = generateAccessToken(teacher._id)

        const response = await discoverTeachers(
            {
                skillId: skill._id.toString()
            },
            accessToken
        )

        expect(response.status).toBe(403)
        expect(response.data.code).toBe(
            ERROR_CODES.ACCOUNT_TYPE_NOT_PERMITTED
        )
    })

})
