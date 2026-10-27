import { jest } from "@jest/globals"
import {
    validateCreateSkillRequest,
    validateGetSkillRequests,
    validateSkillRequestId,
    validateApproveSkillRequest,
    validateRejectSkillRequest
} from "../../../src/modules/skillRequests/skillRequest.validation.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import { SKILL_CATEGORIES } from "../../../src/constants/enums.js"


describe("SkillRequest Validation", () => {

    const createValidSkillRequestBody = (overrides = {}) => ({
        name: "node.js",
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Please add Node.js",
        ...overrides
    })


    const createValidApprovalBody = (overrides = {}) => ({
        name: "node.js",
        displayName: "Node.js",
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Learn Node.js backend development",
        ...overrides
    })


    const getValidationError = (validator, req, next) => {

        try {
            validator(req, {}, next)
            return null
        } catch (error) {
            return error
        }

    }


    // CREATE SKILL REQUEST


    test("Create skill request validation accepts correct data", () => {

        const req = {
            body: createValidSkillRequestBody()
        }

        const next = jest.fn()

        validateCreateSkillRequest(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create skill request validation normalizes name", () => {

        const req = {
            body: createValidSkillRequestBody({
                name: "   Node.js   "
            })
        }

        const next = jest.fn()

        validateCreateSkillRequest(req, {}, next)

        expect(req.body.name).toBe("node.js")
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Create skill request validation rejects unknown request field", () => {

        const req = {
            body: createValidSkillRequestBody({
                status: "APPROVED"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSkillRequest,
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


    test("Create skill request validation rejects missing fields", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSkillRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "name",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "category",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "description",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Create skill request validation rejects invalid name", () => {

        const req = {
            body: createValidSkillRequestBody({
                name: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSkillRequest,
            req,
            next
        )

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


    test("Create skill request validation rejects invalid category", () => {

        const req = {
            body: createValidSkillRequestBody({
                category: "INVALID_CATEGORY"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSkillRequest,
            req,
            next
        )

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


    test("Create skill request validation rejects invalid description", () => {

        const req = {
            body: createValidSkillRequestBody({
                description: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateCreateSkillRequest,
            req,
            next
        )

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


    // GET SKILL REQUESTS


    test("Get skill requests validation applies default pagination", () => {

        const req = {
            query: {}
        }

        const next = jest.fn()

        validateGetSkillRequests(req, {}, next)

        expect(req.pagination).toEqual({
            cursor: null,
            limit: 10
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get skill requests validation accepts cursor pagination", () => {

        const req = {
            query: {
                cursor: "507f1f77bcf86cd799439011",
                limit: "20"
            }
        }

        const next = jest.fn()

        validateGetSkillRequests(req, {}, next)

        expect(req.pagination).toEqual({
            cursor: "507f1f77bcf86cd799439011",
            limit: 20
        })
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Get skill requests validation rejects unknown query field", () => {

        const req = {
            query: {
                cursor: "507f1f77bcf86cd799439011",
                limit: "10",
                status: "PENDING"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSkillRequests,
            req,
            next
        )

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


    test("Get skill requests validation rejects invalid cursor", () => {

        const req = {
            query: {
                cursor: "invalid-skill-request-id",
                limit: "10"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSkillRequests,
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


    test("Get skill requests validation rejects invalid limit", () => {

        const req = {
            query: {
                limit: "101"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateGetSkillRequests,
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


    // SKILL REQUEST ID


    test("Skill request id validation accepts valid id", () => {

        const req = {
            params: {
                skillRequestId: "507f1f77bcf86cd799439011"
            }
        }

        const next = jest.fn()

        validateSkillRequestId(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Skill request id validation rejects missing id", () => {

        const req = {
            params: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSkillRequestId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    test("Skill request id validation rejects invalid id", () => {

        const req = {
            params: {
                skillRequestId: "invalid-id"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateSkillRequestId,
            req,
            next
        )

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ERROR_CODES.INVALID_FIELD_VALUE)
        expect(next).not.toHaveBeenCalled()

    })


    // APPROVE SKILL REQUEST


    test("Approve skill request validation accepts correct data", () => {

        const req = {
            body: createValidApprovalBody()
        }

        const next = jest.fn()

        validateApproveSkillRequest(req, {}, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Approve skill request validation normalizes name and admin response", () => {

        const req = {
            body: createValidApprovalBody({
                name: "   Node.js   ",
                adminResponse: "   Approved by admin   "
            })
        }

        const next = jest.fn()

        validateApproveSkillRequest(req, {}, next)

        expect(req.body.name).toBe("node.js")
        expect(req.body.adminResponse).toBe("Approved by admin")
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Approve skill request validation rejects unknown request field", () => {

        const req = {
            body: createValidApprovalBody({
                status: "APPROVED"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

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


    test("Approve skill request validation rejects missing skill fields", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "name",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "displayName",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "category",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                }),
                expect.objectContaining({
                    field: "description",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Approve skill request validation rejects invalid name", () => {

        const req = {
            body: createValidApprovalBody({
                name: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

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


    test("Approve skill request validation rejects invalid display name", () => {

        const req = {
            body: createValidApprovalBody({
                displayName: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

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


    test("Approve skill request validation rejects invalid category", () => {

        const req = {
            body: createValidApprovalBody({
                category: "INVALID_CATEGORY"
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

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


    test("Approve skill request validation rejects invalid description", () => {

        const req = {
            body: createValidApprovalBody({
                description: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

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


    test("Approve skill request validation rejects invalid admin response", () => {

        const req = {
            body: createValidApprovalBody({
                adminResponse: "   "
            })
        }

        const next = jest.fn()

        const error = getValidationError(
            validateApproveSkillRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    // REJECT SKILL REQUEST


    test("Reject skill request validation accepts and normalizes admin response", () => {

        const req = {
            body: {
                adminResponse: "   Skill request rejected   "
            }
        }

        const next = jest.fn()

        validateRejectSkillRequest(req, {}, next)

        expect(req.body.adminResponse).toBe(
            "Skill request rejected"
        )
        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Reject skill request validation rejects unknown request field", () => {

        const req = {
            body: {
                adminResponse: "Skill request rejected",
                status: "REJECTED"
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateRejectSkillRequest,
            req,
            next
        )

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


    test("Reject skill request validation rejects missing admin response", () => {

        const req = {
            body: {}
        }

        const next = jest.fn()

        const error = getValidationError(
            validateRejectSkillRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })


    test("Reject skill request validation rejects invalid admin response", () => {

        const req = {
            body: {
                adminResponse: "   "
            }
        }

        const next = jest.fn()

        const error = getValidationError(
            validateRejectSkillRequest,
            req,
            next
        )

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "adminResponse",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )
        expect(next).not.toHaveBeenCalled()

    })

})
