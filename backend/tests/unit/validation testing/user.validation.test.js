import { jest } from "@jest/globals"
import {
    validateAccountUpgrade,
    validateUserIdParam,
    validateUpdateProfile,
    validateUpdateTeachingProfile,
    validateChangePassword
} from "../../../src/modules/users/user.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    ACCOUNT_TYPES,
    TEACHING_STYLES,
    LANGUAGES
} from "../../../src/constants/enums.js"


describe("User Validation", () => {

    const firstSkillId = "507f1f77bcf86cd799439011"
    const secondSkillId = "507f191e810c19729de860ea"


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // ACCOUNT UPGRADE


    test("Account upgrade validation accepts correct data", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: [firstSkillId],
                teachingStyles: [TEACHING_STYLES.STEP_BY_STEP]
            }
        }

        const next = jest.fn()

        validateAccountUpgrade(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Account upgrade validation accepts teacher-learner account type", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
                teachingSkills: [firstSkillId],
                teachingStyles: [TEACHING_STYLES.HANDS_ON]
            }
        }

        const next = jest.fn()

        validateAccountUpgrade(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Account upgrade validation rejects unknown request field", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: [firstSkillId],
                teachingStyles: [TEACHING_STYLES.STEP_BY_STEP],
                role: "ADMIN"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "role",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects missing account type", () => {

        const req = {
            body: {
                teachingSkills: [firstSkillId],
                teachingStyles: [TEACHING_STYLES.STEP_BY_STEP]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "accountType",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects invalid account type", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.LEARNER,
                teachingSkills: [firstSkillId],
                teachingStyles: [TEACHING_STYLES.STEP_BY_STEP]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "accountType",
                    code: ERROR_CODES.INVALID_ACCOUNT_TYPE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects teaching fields if they are not arrays", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: firstSkillId,
                teachingStyles: TEACHING_STYLES.STEP_BY_STEP
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects empty teaching fields", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: [],
                teachingStyles: []
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects invalid teaching values", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: ["invalid-id"],
                teachingStyles: ["INVALID_STYLE"]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_TEACHING_STYLE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Account upgrade validation rejects duplicate teaching values", () => {

        const req = {
            body: {
                accountType: ACCOUNT_TYPES.TEACHER,
                teachingSkills: [firstSkillId, firstSkillId.toUpperCase()],
                teachingStyles: [
                    TEACHING_STYLES.STEP_BY_STEP,
                    TEACHING_STYLES.STEP_BY_STEP
                ]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateAccountUpgrade,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // USER ID PARAM


    test("User id validation accepts valid user id", () => {

        const req = {
            params: {
                userId: firstSkillId
            }
        }

        const next = jest.fn()

        validateUserIdParam(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("User id validation rejects missing user id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUserIdParam,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.errors).toEqual([
            {
                field: "userId",
                message: "User ID must be a valid MongoDB ObjectId",
                code: ERROR_CODES.INVALID_FIELD_VALUE
            }
        ])
        expect(next).not.toHaveBeenCalled()

    })


    test("User id validation rejects invalid user id", () => {

        const req = {
            params: {
                userId: "invalid-user-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUserIdParam,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // UPDATE PROFILE


    test("Profile update validation accepts correct profile data", () => {

        const req = {
            body: {
                fullname: "Test User",
                languages: [LANGUAGES.ENGLISH, LANGUAGES.HINDI]
            }
        }

        const next = jest.fn()

        validateUpdateProfile(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Profile update validation normalizes fullname", () => {

        const req = {
            body: {
                fullname: "   Test User   "
            }
        }

        const next = jest.fn()

        validateUpdateProfile(req, {}, next)

        expect(req.body.fullname).toBe("Test User")
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Profile update validation converts single language into an array", () => {

        const req = {
            body: {
                languages: LANGUAGES.ENGLISH
            }
        }

        const next = jest.fn()

        validateUpdateProfile(req, {}, next)

        expect(req.body.languages).toEqual([LANGUAGES.ENGLISH])
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Profile update validation accepts avatar file only", () => {

        const req = {
            body: {},
            file: {
                path: "/tmp/avatar.jpg"
            }
        }

        const next = jest.fn()

        validateUpdateProfile(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Profile update validation rejects unknown request field", () => {

        const req = {
            body: {
                fullname: "Test User",
                role: "ADMIN"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "role",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects empty request", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "profile",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects invalid fullname", () => {

        const req = {
            body: {
                fullname: "   "
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects fullname with invalid length", () => {

        const req = {
            body: {
                fullname: "A"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects fullname with invalid characters", () => {

        const req = {
            body: {
                fullname: "Test User123"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects languages if it is not an array or string", () => {

        const req = {
            body: {
                languages: 123
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects empty languages array", () => {

        const req = {
            body: {
                languages: []
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects invalid language", () => {

        const req = {
            body: {
                languages: ["INVALID_LANGUAGE"]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_LANGUAGE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Profile update validation rejects duplicate languages", () => {

        const req = {
            body: {
                languages: [LANGUAGES.ENGLISH, LANGUAGES.ENGLISH]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // UPDATE TEACHING PROFILE


    test("Teaching profile validation accepts correct data", () => {

        const req = {
            body: {
                teachingSkills: [firstSkillId, secondSkillId],
                teachingStyles: [
                    TEACHING_STYLES.STEP_BY_STEP,
                    TEACHING_STYLES.HANDS_ON
                ]
            }
        }

        const next = jest.fn()

        validateUpdateTeachingProfile(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Teaching profile validation accepts one provided field", () => {

        const req = {
            body: {
                teachingSkills: [firstSkillId]
            }
        }

        const next = jest.fn()

        validateUpdateTeachingProfile(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Teaching profile validation rejects unknown request field", () => {

        const req = {
            body: {
                teachingSkills: [firstSkillId],
                accountType: ACCOUNT_TYPES.TEACHER
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "accountType",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Teaching profile validation rejects empty request", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingProfile",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Teaching profile validation rejects teaching fields if they are not arrays", () => {

        const req = {
            body: {
                teachingSkills: firstSkillId,
                teachingStyles: TEACHING_STYLES.STEP_BY_STEP
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Teaching profile validation rejects empty teaching fields", () => {

        const req = {
            body: {
                teachingSkills: [],
                teachingStyles: []
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Teaching profile validation rejects invalid teaching values", () => {

        const req = {
            body: {
                teachingSkills: ["invalid-id"],
                teachingStyles: ["INVALID_STYLE"]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_TEACHING_STYLE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Teaching profile validation rejects duplicate teaching values", () => {

        const req = {
            body: {
                teachingSkills: [firstSkillId, firstSkillId.toUpperCase()],
                teachingStyles: [
                    TEACHING_STYLES.STEP_BY_STEP,
                    TEACHING_STYLES.STEP_BY_STEP
                ]
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateUpdateTeachingProfile,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // CHANGE PASSWORD


    test("Change password validation accepts correct passwords", () => {

        const req = {
            body: {
                currentPassword: "Current@123",
                newPassword: "NewPassword@123"
            }
        }

        const next = jest.fn()

        validateChangePassword(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Change password validation rejects unknown request field", () => {

        const req = {
            body: {
                currentPassword: "Current@123",
                newPassword: "NewPassword@123",
                confirmPassword: "NewPassword@123"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateChangePassword,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "confirmPassword",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Change password validation rejects missing passwords", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateChangePassword,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "currentPassword",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "newPassword",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Change password validation rejects passwords if they are not strings", () => {

        const req = {
            body: {
                currentPassword: 12345678,
                newPassword: 87654321
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateChangePassword,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "currentPassword",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                }),
                expect.objectContaining({
                    field: "newPassword",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Change password validation rejects short new password", () => {

        const req = {
            body: {
                currentPassword: "Current@123",
                newPassword: "New@1"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateChangePassword,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "newPassword",
                    message: "New password must be at least 8 characters long",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Change password validation rejects new password without required character types", () => {

        const req = {
            body: {
                currentPassword: "Current@123",
                newPassword: "newpassword"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateChangePassword,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "newPassword",
                    message: "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })

})
