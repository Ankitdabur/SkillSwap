import { jest } from "@jest/globals";
import {
    validateSkillId,
    validateCreateSkill
} from "../../../src/modules/skills/skill.validation.js";
import { ERROR_CODES } from "../../../src/constants/errorCodes.js";
import { SKILL_CATEGORIES } from "../../../src/constants/enums.js";


describe("Skill Validation", () => {

    const createValidSkillBody = (overrides = {}) => ({
        name: "javascript",
        displayName: "JavaScript",
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Learn JavaScript programming",
        ...overrides
    })


    // SKILL ID


    test("Skill id validation accepts valid skill id", () => {

        const req = {
            params: {
                skillId: "507f1f77bcf86cd799439011"
            }
        }

        const res = {}
        const next = jest.fn()

        validateSkillId(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Skill id validation rejects missing skill id", () => {

        const req = {
            params: {}
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateSkillId(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Skill id validation rejects invalid skill id", () => {

        const req = {
            params: {
                skillId: "invalid-skill-id"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateSkillId(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // CORRECT SKILL DATA


    test("Create skill validation accepts correct skill data", () => {

        const req = {
            body: createValidSkillBody()
        }

        const res = {}
        const next = jest.fn()

        validateCreateSkill(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create skill validation normalizes skill name", () => {

        const req = {
            body: createValidSkillBody({
                name: "   JavaScript   "
            })
        }

        const res = {}
        const next = jest.fn()

        validateCreateSkill(req, res, next)

        expect(req.body.name).toBe("javascript")
        expect(next).toHaveBeenCalledTimes(1)

    })


    // REQUEST BODY


    test("Create skill validation rejects unknown request field", () => {

        const req = {
            body: createValidSkillBody({
                difficulty: "BEGINNER"
            })
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "difficulty",
                    code: ERROR_CODES.INVALID_REQUEST
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // NAME


    test("Create skill validation rejects missing name", () => {

        const body = createValidSkillBody()

        delete body.name

        const req = {body}
        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "name",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Create skill validation rejects invalid name", () => {

        const req = {
            body: createValidSkillBody({
                name: "   "
            })
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "name",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // DISPLAY NAME


    test("Create skill validation rejects missing display name", () => {

        const body = createValidSkillBody()

        delete body.displayName

        const req = {body}
        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "displayName",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Create skill validation rejects invalid display name", () => {

        const req = {
            body: createValidSkillBody({
                displayName: "   "
            })
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "displayName",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // CATEGORY


    test("Create skill validation rejects missing category", () => {

        const body = createValidSkillBody()

        delete body.category

        const req = {body}
        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "category",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Create skill validation rejects invalid category", () => {

        const req = {
            body: createValidSkillBody({
                category: "INVALID_CATEGORY"
            })
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "category",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    // DESCRIPTION


    test("Create skill validation rejects missing description", () => {

        const body = createValidSkillBody()

        delete body.description

        const req = {body}
        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "description",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Create skill validation rejects invalid description", () => {

        const req = {
            body: createValidSkillBody({
                description: "   "
            })
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateCreateSkill(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "description",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })

})
