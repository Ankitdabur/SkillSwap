import {jest} from "@jest/globals"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import User from "../../src/models/user.model.js"
import {
    USER_ROLES,
    ACCOUNT_TYPES,
    TEACHING_STYLES,
    LANGUAGES
} from "../../src/constants/enums.js"


describe("User Model", () => {

    const createLearnerData = (overrides = {}) => ({
        fullname: "Test Learner",
        username: "testlearner",
        email: "testlearner@gmail.com",
        password: "Password@123",
        accountType: ACCOUNT_TYPES.LEARNER,
        languages: [LANGUAGES.ENGLISH],
        ...overrides
    })


    const createTeacherData = (overrides = {}) => ({
        fullname: "Test Teacher",
        username: "testteacher",
        email: "testteacher@gmail.com",
        password: "Password@123",
        accountType: ACCOUNT_TYPES.TEACHER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            new mongoose.Types.ObjectId()
        ],
        teachingStyles: [
            TEACHING_STYLES.STEP_BY_STEP
        ],
        ...overrides
    })


    const createTeacherLearnerData = (overrides = {}) => ({
        fullname: "Test Teacher Learner",
        username: "testteacherlearner",
        email: "testteacherlearner@gmail.com",
        password: "Password@123",
        accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            new mongoose.Types.ObjectId()
        ],
        teachingStyles: [
            TEACHING_STYLES.STEP_BY_STEP
        ],
        ...overrides
    })


    const getValidationError = async (user) => {

        try {
            await user.validate()
            return null
        } catch (error) {
            return error
        }

    }


    const hasFieldError = (error, field) => {

        return Object.keys(error.errors).some(
            (key) => key === field || key.startsWith(`${field}.`)
        )

    }


    afterEach(() => {
        jest.restoreAllMocks()
    })



    // VALID USERS


    test("Valid learner user passes validation", async () => {

        const user = new User(
            createLearnerData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Valid teacher user passes validation", async () => {

        const user = new User(
            createTeacherData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Valid teacher-learner user passes validation", async () => {

        const user = new User(
            createTeacherLearnerData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    // AVATAR

    test("User can be created without avatar", async () => {

        const user = new User(
            createLearnerData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

        expect(user.avatar).toBeUndefined()

    })


    // USERNAME

    test("Username is required", async () => {

        const data = createLearnerData()

        delete data.username

        const user = new User(data)

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "username")).toBe(true)

    })


    test("Username is trimmed", () => {

        const user = new User(
            createLearnerData({
                username: "   testlearner   "
            })
        )

        expect(user.username).toBe("testlearner")

    })


    test("Username is converted to lowercase", () => {

        const user = new User(
            createLearnerData({
                username: "TESTLEARNER"
            })
        )

        expect(user.username).toBe("testlearner")

    })


    test("Username is configured as unique", () => {

        const usernamePath = User.schema.path("username")

        expect(usernamePath.options.unique).toBe(true)

    })



    // FULLNAME

    test("Fullname is required", async () => {

        const data = createLearnerData()

        delete data.fullname

        const user = new User(data)

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "fullname")).toBe(true)

    })


    test("Fullname is trimmed", () => {

        const user = new User(
            createLearnerData({
                fullname: "   Test Learner   "
            })
        )

        expect(user.fullname).toBe("Test Learner")

    })

    // EMAIL

    test("Email is required", async () => {

        const data = createLearnerData()

        delete data.email

        const user = new User(data)

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "email")).toBe(true)

    })


    test("Email is trimmed", () => {

        const user = new User(
            createLearnerData({
                email: "   testlearner@gmail.com   "
            })
        )

        expect(user.email).toBe("testlearner@gmail.com")

    })


    test("Email is converted to lowercase", () => {

        const user = new User(
            createLearnerData({
                email: "TESTLEARNER@GMAIL.COM"
            })
        )

        expect(user.email).toBe("testlearner@gmail.com")

    })


    test("Email is configured as unique", () => {

        const emailPath = User.schema.path("email")

        expect(emailPath.options.unique).toBe(true)

    })


    // PASSWORD

    test("Password is required", async () => {

        const data = createLearnerData()

        delete data.password

        const user = new User(data)

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "password")).toBe(true)

    })


    test("Password is configured to be excluded from normal queries", () => {

        const passwordPath = User.schema.path("password")

        expect(passwordPath.options.select).toBe(false)

    })


    // REFRESH TOKEN HASH


    test("Refresh token hash defaults to null", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.refreshTokenHash).toBeNull()

    })


    test("Refresh token hash is configured to be excluded from normal queries", () => {

        const refreshTokenPath =
            User.schema.path("refreshTokenHash")

        expect(refreshTokenPath.options.select).toBe(false)

    })


    // ROLE

    test("Role defaults to USER", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.role).toBe(USER_ROLES.USER)

    })


    test("ADMIN is accepted as a valid role", async () => {

        const user = new User(
            createLearnerData({
                role: USER_ROLES.ADMIN
            })
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Invalid role is rejected", async () => {

        const user = new User(
            createLearnerData({
                role: "SUPER_ADMIN"
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "role")).toBe(true)

    })

    // ACCOUNT TYPE


    test("Account type is required", async () => {

        const data = createLearnerData()

        delete data.accountType

        const user = new User(data)

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "accountType")).toBe(true)

    })


    test("Invalid account type is rejected", async () => {

        const user = new User(
            createLearnerData({
                accountType: "STUDENT"
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "accountType")).toBe(true)

    })


    // LANGUAGES


    test("At least one language is required", async () => {

        const user = new User(
            createLearnerData({
                languages: []
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "languages")).toBe(true)

    })


    test("Valid languages are accepted", async () => {

        const user = new User(
            createLearnerData({
                languages: [
                    LANGUAGES.ENGLISH,
                    LANGUAGES.HINDI
                ]
            })
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Invalid language is rejected", async () => {

        const user = new User(
            createLearnerData({
                languages: ["FRENCH"]
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "languages")).toBe(true)

    })

    // TEACHING SKILLS


    test("Teacher must have at least one teaching skill", async () => {

        const user = new User(
            createTeacherData({
                teachingSkills: []
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingSkills")).toBe(true)

    })


    test("Teacher-learner must have at least one teaching skill", async () => {

        const user = new User(
            createTeacherLearnerData({
                teachingSkills: []
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingSkills")).toBe(true)

    })


    test("Learner with no teaching skills is accepted", async () => {

        const user = new User(
            createLearnerData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Learner containing teaching skills is rejected", async () => {

        const user = new User(
            createLearnerData({
                teachingSkills: [
                    new mongoose.Types.ObjectId()
                ]
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingSkills")).toBe(true)

    })


    test("Valid teaching skill ObjectId is accepted", async () => {

        const user = new User(
            createTeacherData({
                teachingSkills: [
                    new mongoose.Types.ObjectId()
                ]
            })
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Invalid teaching skill ObjectId is rejected", async () => {

        const user = new User(
            createTeacherData({
                teachingSkills: ["invalid-object-id"]
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingSkills")).toBe(true)

    })


    test("Teaching skills reference the Skill model", () => {

        const teachingSkillsPath = User.schema.path("teachingSkills")

        expect(teachingSkillsPath.embeddedSchemaType.options.ref).toBe("Skill")

    })


    // TEACHING STYLES


    test("Teacher must have at least one teaching style", async () => {

        const user = new User(
            createTeacherData({
                teachingStyles: []
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingStyles")).toBe(true)

    })


    test("Teacher-learner must have at least one teaching style", async () => {

        const user = new User(
            createTeacherLearnerData({
                teachingStyles: []
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingStyles")).toBe(true)

    })


    test("Learner with no teaching styles is accepted", async () => {

        const user = new User(
            createLearnerData()
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Learner containing teaching styles is rejected", async () => {

        const user = new User(
            createLearnerData({
                teachingStyles: [
                    TEACHING_STYLES.STEP_BY_STEP
                ]
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingStyles")).toBe(true)

    })


    test("Valid teaching style is accepted", async () => {

        const user = new User(
            createTeacherData({
                teachingStyles: [
                    TEACHING_STYLES.HANDS_ON
                ]
            })
        )

        await expect(user.validate()).resolves.toBeUndefined()

    })


    test("Invalid teaching style is rejected", async () => {

        const user = new User(
            createTeacherData({
                teachingStyles: ["RANDOM_STYLE"]
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "teachingStyles")).toBe(true)

    })

    // RATING

    test("Rating defaults to 0", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.rating).toBe(0)

    })


    test("Rating below 0 is rejected", async () => {

        const user = new User(
            createLearnerData({
                rating: -1
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    test("Rating above 5 is rejected", async () => {

        const user = new User(
            createLearnerData({
                rating: 6
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "rating")).toBe(true)

    })


    // TOTAL REVIEWS


    test("Total reviews defaults to 0", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.totalReviews).toBe(0)

    })


    test("Negative total reviews are rejected", async () => {

        const user = new User(
            createLearnerData({
                totalReviews: -1
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "totalReviews")).toBe(true)

    })


    // CONNECTIONS

    test("Connections default to 0", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.connections).toBe(0)

    })


    test("Negative connections are rejected", async () => {

        const user = new User(
            createLearnerData({
                connections: -1
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "connections")).toBe(true)

    })


    // CREDITS


    test("Credits default to 0", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.credits).toBe(0)

    })


    test("Negative credits are rejected", async () => {

        const user = new User(
            createLearnerData({
                credits: -1
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "credits")).toBe(true)

    })


    // RESERVED CREDITS

    test("Reserved credits default to 0", () => {

        const user = new User(
            createLearnerData()
        )

        expect(user.reservedCredits).toBe(0)

    })


    test("Negative reserved credits are rejected", async () => {

        const user = new User(
            createLearnerData({
                reservedCredits: -1
            })
        )

        const error = await getValidationError(user)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "reservedCredits")).toBe(true)

    })



    // TIMESTAMPS


    test("User schema has timestamps enabled", () => {

        expect(
            User.schema.options.timestamps
        ).toBe(true)

    })


    // PASSWORD SAVE HOOK


    test("Password is hashed before saving a new user", async () => {

        const plainPassword = "Password@123"

        const user = new User(
            createLearnerData({
                password: plainPassword
            })
        )

        jest.spyOn(
            User.collection,
            "insertOne"
        ).mockResolvedValue({
            acknowledged: true,
            insertedId: user._id
        })

        await user.save()

        expect(user.password).not.toBe(plainPassword)

        const passwordMatches = await bcrypt.compare(
            plainPassword,
            user.password
        )

        expect(passwordMatches).toBe(true)

    })


    test("Password is not hashed again when another field is updated", async () => {

        const user = new User(
            createLearnerData()
        )

        jest.spyOn(
            User.collection,
            "insertOne"
        ).mockResolvedValue({
            acknowledged: true,
            insertedId: user._id
        })

        await user.save()

        const firstPasswordHash = user.password

        jest.spyOn(
            User.collection,
            "updateOne"
        ).mockResolvedValue({
            acknowledged: true,
            matchedCount: 1,
            modifiedCount: 1
        })

        user.fullname = "Updated Learner"

        await user.save()

        expect(user.password).toBe(firstPasswordHash)

    })


    test("Password is hashed again when password is changed", async () => {

        const user = new User(
            createLearnerData({
                password: "Password@123"
            })
        )

        jest.spyOn(
            User.collection,
            "insertOne"
        ).mockResolvedValue({
            acknowledged: true,
            insertedId: user._id
        })

        await user.save()

        const oldPasswordHash = user.password

        jest.spyOn(
            User.collection,
            "updateOne"
        ).mockResolvedValue({
            acknowledged: true,
            matchedCount: 1,
            modifiedCount: 1
        })

        user.password = "NewPassword@123"

        await user.save()

        expect(user.password).not.toBe(oldPasswordHash)

        const passwordMatches = await bcrypt.compare(
            "NewPassword@123",
            user.password
        )

        expect(passwordMatches).toBe(true)

    })


    // PASSWORD COMPARISON METHOD

    test("isPasswordCorrect returns true for correct password", async () => {

        const plainPassword = "Password@123"

        const hashedPassword = await bcrypt.hash(
            plainPassword,
            10
        )

        const user = new User(
            createLearnerData({
                password: hashedPassword
            })
        )

        const result = await user.isPasswordCorrect(
            plainPassword
        )

        expect(result).toBe(true)

    })


    test("isPasswordCorrect returns false for incorrect password", async () => {

        const hashedPassword = await bcrypt.hash(
            "Password@123",
            10
        )

        const user = new User(
            createLearnerData({
                password: hashedPassword
            })
        )

        const result = await user.isPasswordCorrect(
            "WrongPassword@123"
        )

        expect(result).toBe(false)

    })

})
