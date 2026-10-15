import {
    validateEnvironment
} from "../../src/utils/validateEnvironment.js"


const originalEnvironment = {
    ...process.env
}

const validEnvironment = {
    MONGODB_URL: "test-mongodb-url",
    ACCESS_TOKEN_SECRET: "test-access-token-secret",
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_SECRET: "test-refresh-token-secret",
    REFRESH_TOKEN_EXPIRY: "7d",
    CORS_ORIGIN: "http://localhost:3000",
    CLOUDINARY_CLOUD_NAME: "test-cloud-name",
    CLOUDINARY_API_KEY: "test-api-key",
    CLOUDINARY_API_SECRET: "test-api-secret"
}

beforeEach(() => {
    process.env = {
            ...validEnvironment
        }
})

afterEach(() => {
    process.env = {
            ...originalEnvironment
        }
})

afterAll( ()=> {
    process.env = {
            ...originalEnvironment
        }
})

describe("Environment Validation", () => {

    test("Environment validation succeeds when all required variables exist", () => {


        let error

        try {
            validateEnvironment()
        } catch (err) {
            error = err
        }

        expect(error).toBeUndefined()

    })


    test("Environment validation rejects a missing variable", () => {


        delete process.env.MONGODB_URL

        let error

        try {
            validateEnvironment()
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.message).toContain("MONGODB_URL")

    })


    test("Environment validation rejects an empty variable", () => {

        process.env.ACCESS_TOKEN_SECRET = "   "
        

        let error

        try {
            validateEnvironment()
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.message).toContain(
            "ACCESS_TOKEN_SECRET"
        )

    })


    test("Environment validation reports all missing variables", () => {


        delete process.env.MONGODB_URL
        delete process.env.REFRESH_TOKEN_SECRET

        let error

        try {
            validateEnvironment()
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.message).toContain("MONGODB_URL")
        expect(error.message).toContain("REFRESH_TOKEN_SECRET")

    })

})
