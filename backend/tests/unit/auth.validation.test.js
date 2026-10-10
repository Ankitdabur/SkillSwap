import { jest } from "@jest/globals";
import { validateRegister } from "../../src/modules/auth/auth.validation.js";
import { ERROR_CODES } from "../../src/constants/errorCodes.js";

describe("Auth Validation", () => {
    
    //CORRECT DATA TEST
    test("Register validation succeeds if all learner data is correct" , () => {
        
        const req = {
            body : {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req , res , next)

        expect(next).toHaveBeenCalledTimes(1)
    })

    test("Register validation succeeds if all teacher data is correct", () => {

    const req = {
        body: {
            fullname: "Test Teacher",
            username: "testteacher",
            email: "testteacher@gmail.com",
            password: "Password@123",
            accountType: "TEACHER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    })

    test("Register validation succeeds if all teacher-learner data is correct", () => {

    const req = {
        body: {
            fullname: "Test Teacher Learner",
            username: "testteacherlearner",
            email: "testteacherlearner@gmail.com",
            password: "Password@123",
            accountType: "TEACHER_LEARNER",
            languages: ["ENGLISH", "HINDI"],
            teachingSkills: ["507f1f77bcf86cd799439011"],
            teachingStyles: ["STEP_BY_STEP", "HANDS_ON"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    })

    //INVALID FIELD TEST AND TEACHING STYLE & SKILL FIELDS TEST

    test("Learner account must not contain teachingSkills", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"],
                teachingSkills: ["507f1f77bcf86cd799439011"]
            }
        }

    const res = {}
    const next = jest.fn()

    let error 
     
    try{
        validateRegister(req , res , next)
    } catch(err){
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual([{
                field: "teachingSkills",
                message:"Learner accounts must not provide teaching skills",
                code: ERROR_CODES.INVALID_FIELD_VALUE
            }])
    })

    test("Learner account must not contain teachingStyles", () => {

    const req = {
        body: {
            fullname: "Test Learner",
            username: "testlearner",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingStyles",
                code: ERROR_CODES.INVALID_FIELD_VALUE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Learner account must not contain teachingSkills and teachingStyles", () => {

    const req = {
        body: {
            fullname: "Test Learner",
            username: "testlearner",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingSkills"
            }),
            expect.objectContaining({
                field: "teachingStyles"
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })

    
    test("Teacher account must contain teachingSkills", () => {

    const req = {
        body: {
            fullname: "Test Teacher",
            username: "testteacher",
            email: "testteacher@gmail.com",
            password: "Password@123",
            accountType: "TEACHER",
            languages: ["ENGLISH"],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingSkills",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher account must contain teachingStyles", () => {

    const req = {
        body: {
            fullname: "Test Teacher",
            username: "testteacher",
            email: "testteacher@gmail.com",
            password: "Password@123",
            accountType: "TEACHER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingStyles",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher account must not have empty teachingSkills array", () => {

    const req = {
        body: {
            fullname: "Test Teacher",
            username: "testteacher",
            email: "testteacher@gmail.com",
            password: "Password@123",
            accountType: "TEACHER",
            languages: ["ENGLISH"],
            teachingSkills: [],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingSkills",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher account must not have empty teachingStyles array", () => {

    const req = {
        body: {
            fullname: "Test Teacher",
            username: "testteacher",
            email: "testteacher@gmail.com",
            password: "Password@123",
            accountType: "TEACHER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"],
            teachingStyles: []
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingStyles",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher-Learner account must contain teachingSkills", () => {

    const req = {
        body: {
            fullname: "Test Teacher Learner",
            username: "testteacherlearner",
            email: "testteacherlearner@gmail.com",
            password: "Password@123",
            accountType: "TEACHER_LEARNER",
            languages: ["ENGLISH"],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingSkills",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher-Learner account must contain teachingStyles", () => {

    const req = {
        body: {
            fullname: "Test Teacher Learner",
            username: "testteacherlearner",
            email: "testteacherlearner@gmail.com",
            password: "Password@123",
            accountType: "TEACHER_LEARNER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingStyles",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher-Learner account must not have empty teachingSkills array", () => {

    const req = {
        body: {
            fullname: "Test Teacher Learner",
            username: "testteacherlearner",
            email: "testteacherlearner@gmail.com",
            password: "Password@123",
            accountType: "TEACHER_LEARNER",
            languages: ["ENGLISH"],
            teachingSkills: [],
            teachingStyles: ["STEP_BY_STEP"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingSkills",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })


    test("Teacher-Learner account must not have empty teachingStyles array", () => {

    const req = {
        body: {
            fullname: "Test Teacher Learner",
            username: "testteacherlearner",
            email: "testteacherlearner@gmail.com",
            password: "Password@123",
            accountType: "TEACHER_LEARNER",
            languages: ["ENGLISH"],
            teachingSkills: ["507f1f77bcf86cd799439011"],
            teachingStyles: []
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error.statusCode).toBe(400)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "teachingStyles",
                code: ERROR_CODES.TEACHING_PROFILE_INCOMPLETE
            })
        ])
    )

    expect(next).not.toHaveBeenCalled()

    })

    /
    // FULLNAME
    

    test("Register validation accepts correct fullname", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects missing fullname", () => {

        const req = {
            body: {
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

        expect(next).not.toHaveBeenCalled()

    })


    test("Register validation rejects fullname if it is not a string", () => {

        const req = {
            body: {
                fullname: 12345,
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects fullname shorter than 2 characters", () => {

        const req = {
            body: {
                fullname: "A",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects fullname with invalid characters", () => {

        const req = {
            body: {
                fullname: "Test@123",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "fullname",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    
    // USERNAME
    

    test("Register validation accepts correct username", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "test_learner123",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects missing username", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "username",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

    })


    test("Register validation rejects username if it is not a string", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: 12345,
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "username",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects uppercase username", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "TestLearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "username",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects username shorter than 3 characters", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "ab",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "username"
                })
            ])
        )

    })


   
    // EMAIL
    

    test("Register validation accepts correct email", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "TESTLEARNER@GMAIL.COM",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

        expect(req.body.email).toBe("testlearner@gmail.com")

    })


    test("Register validation rejects missing email", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "email",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

    })


    test("Register validation rejects invalid email format", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearnergmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "email",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


   
    // PASSWORD
   

    test("Register validation accepts correct password", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects missing password", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "password",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

    })


    test("Register validation rejects password shorter than 8 characters", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Ab@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "password",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects password without required complexity", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "password123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "password",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


   
    // ACCOUNT TYPE
   

    test("Register validation accepts correct accountType", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects missing accountType", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "accountType",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

    })


    test("Register validation rejects invalid accountType", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "STUDENT",
                languages: ["ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "accountType",
                    code: ERROR_CODES.INVALID_ACCOUNT_TYPE
                })
            ])
        )

    })


    
    // LANGUAGES
    

    test("Register validation accepts correct languages", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH", "HINDI"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects missing languages", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.MISSING_REQUIRED_FIELDS
                })
            ])
        )

    })


    test("Register validation rejects languages if it is not an array", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: "ENGLISH"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects empty languages array", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: []
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages"
                })
            ])
        )

    })


    test("Register validation rejects invalid language", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH", "FRENCH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_LANGUAGE
                })
            ])
        )

    })


    test("Register validation rejects duplicate languages", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH", "ENGLISH"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "languages",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    
    // TEACHING SKILLS
    

    test("Register validation accepts correct teachingSkills", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: ["STEP_BY_STEP"]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects invalid teaching skill ObjectId", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: ["invalid-id"],
                teachingStyles: ["STEP_BY_STEP"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects teachingSkills if it is not an array", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: "507f1f77bcf86cd799439011",
                teachingStyles: ["STEP_BY_STEP"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills"
                })
            ])
        )

    })


    test("Register validation rejects duplicate teachingSkills", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011",
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: ["STEP_BY_STEP"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingSkills",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    
    // TEACHING STYLES
    

    test("Register validation accepts correct teachingStyles", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: [
                    "STEP_BY_STEP",
                    "HANDS_ON"
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        validateRegister(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation rejects invalid teachingStyle", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: ["RANDOM_STYLE"]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_TEACHING_STYLE
                })
            ])
        )

    })


    test("Register validation rejects teachingStyles if it is not an array", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: "STEP_BY_STEP"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


    test("Register validation rejects duplicate teachingStyles", () => {

        const req = {
            body: {
                fullname: "Test Teacher",
                username: "testteacher",
                email: "testteacher@gmail.com",
                password: "Password@123",
                accountType: "TEACHER",
                languages: ["ENGLISH"],
                teachingSkills: [
                    "507f1f77bcf86cd799439011"
                ],
                teachingStyles: [
                    "STEP_BY_STEP",
                    "STEP_BY_STEP"
                ]
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

        expect(error.statusCode).toBe(400)

        expect(error.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: "teachingStyles",
                    code: ERROR_CODES.INVALID_FIELD_VALUE
                })
            ])
        )

    })


   
    // UNKNOWN FIELD


    test("Register validation rejects unknown registration field", () => {

        const req = {
            body: {
                fullname: "Test Learner",
                username: "testlearner",
                email: "testlearner@gmail.com",
                password: "Password@123",
                accountType: "LEARNER",
                languages: ["ENGLISH"],
                role: "ADMIN"
            }
        }

        const res = {}
        const next = jest.fn()

        let error

        try {
            validateRegister(req, res, next)
        } catch (err) {
            error = err
        }

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

    // SOME OTHER TESTS

    test("Register validation trims fullname after successful validation", () => {

    const req = {
        body: {
            fullname: "   Test Learner   ",
            username: "testlearner",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.body.fullname).toBe("Test Learner")

    })


    test("Register validation collects multiple errors together", () => {

    const req = {
        body: {
            fullname: "A",
            username: "AB",
            email: "invalidemail",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    let error

    try {
        validateRegister(req, res, next)
    } catch (err) {
        error = err
    }

    expect(error).toBeDefined()
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe(ERROR_CODES.INVALID_REQUEST)

    expect(error.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                field: "fullname"
            }),
            expect.objectContaining({
                field: "username"
            }),
            expect.objectContaining({
                field: "email"
            })
        ])
    )

    expect(error.errors).toHaveLength(3)
    expect(next).not.toHaveBeenCalled()

    })


    test("Register validation accepts fullname with exactly 2 characters", () => {

    const req = {
        body: {
            fullname: "AB",
            username: "testlearner",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation accepts fullname with exactly 60 characters", () => {

    const req = {
        body: {
            fullname: "A".repeat(60),
            username: "testlearner",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation accepts username with exactly 3 characters", () => {

    const req = {
        body: {
            fullname: "Test Learner",
            username: "abc",
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    })


    test("Register validation accepts username with exactly 30 characters", () => {

    const req = {
        body: {
            fullname: "Test Learner",
            username: "a".repeat(30),
            email: "testlearner@gmail.com",
            password: "Password@123",
            accountType: "LEARNER",
            languages: ["ENGLISH"]
        }
    }

    const res = {}
    const next = jest.fn()

    validateRegister(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    }) 




})
