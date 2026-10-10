import {jest} from "@jest/globals"
import jwt from "jsonwebtoken"
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashRefreshToken,
    compareRefreshToken
} from "../../src/utils/token.js"
import { ERROR_CODES } from "../../src/constants/errorCodes.js"


describe("Token Utils", () => {

    beforeAll(() => {

        process.env.ACCESS_TOKEN_SECRET = "test-access-token-secret"
        process.env.ACCESS_TOKEN_EXPIRY = "15m"

        process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret"
        process.env.REFRESH_TOKEN_EXPIRY = "7d"

    })

    // ACCESS TOKEN GENERATION

    test("generateAccessToken generates a valid access token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateAccessToken(userId)

        expect(token).toBeDefined()
        expect(typeof token).toBe("string")

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        )

        expect(decodedToken._id).toBe(userId)

    })


    test("generated access token contains expiry", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateAccessToken(userId)

        const decodedToken = jwt.decode(token)

        expect(decodedToken.iat).toBeDefined()
        expect(decodedToken.exp).toBeDefined()

        expect(decodedToken.exp).toBeGreaterThan(decodedToken.iat)

    })

    // REFRESH TOKEN GENERATION


    test("generateRefreshToken generates a valid refresh token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateRefreshToken(userId)

        expect(token).toBeDefined()
        expect(typeof token).toBe("string")

        const decodedToken = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        )

        expect(decodedToken._id).toBe(userId)

    })


    test("generated refresh token contains expiry", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateRefreshToken(userId)

        const decodedToken = jwt.decode(token)

        expect(decodedToken.iat).toBeDefined()
        expect(decodedToken.exp).toBeDefined()

        expect(decodedToken.exp).toBeGreaterThan(decodedToken.iat)

    })


    // ACCESS TOKEN VERIFICATION

    test("verifyAccessToken accepts a valid access token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateAccessToken(userId)

        const decodedToken = verifyAccessToken(token)

        expect(decodedToken).toBeDefined()
        expect(decodedToken._id).toBe(userId)

    })


    test("verifyAccessToken rejects an invalid access token", () => {

        const token = "invalid-access-token"

        let error

        try {
            verifyAccessToken(token)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.INVALID_ACCESS_TOKEN)

    })


    test("verifyAccessToken rejects an expired access token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const expiredToken = jwt.sign(
            {
                _id: userId
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "-1s"
            }
        )

        let error

        try {
            verifyAccessToken(expiredToken)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.ACCESS_TOKEN_EXPIRED)

    })


    test("verifyAccessToken rejects a refresh token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const refreshToken = generateRefreshToken(userId)

        let error

        try {
            verifyAccessToken(refreshToken)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.INVALID_ACCESS_TOKEN)

    })


    // REFRESH TOKEN VERIFICATION

    test("verifyRefreshToken accepts a valid refresh token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const token = generateRefreshToken(userId)

        const decodedToken = verifyRefreshToken(token)

        expect(decodedToken).toBeDefined()
        expect(decodedToken._id).toBe(userId)

    })


    test("verifyRefreshToken rejects an invalid refresh token", () => {

        const token = "invalid-refresh-token"

        let error

        try {
            verifyRefreshToken(token)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.INVALID_REFRESH_TOKEN)

    })


    test("verifyRefreshToken rejects an expired refresh token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const expiredToken = jwt.sign(
            {
                _id: userId
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "-1s"
            }
        )

        let error

        try {
            verifyRefreshToken(expiredToken)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.REFRESH_TOKEN_EXPIRED)

    })


    test("verifyRefreshToken rejects an access token", () => {

        const userId = "507f1f77bcf86cd799439011"

        const accessToken = generateAccessToken(userId)

        let error

        try {
            verifyRefreshToken(accessToken)
        } catch (err) {
            error = err
        }

        expect(error).toBeDefined()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe(ERROR_CODES.INVALID_REFRESH_TOKEN)

    })


    // REFRESH TOKEN HASHING

    test("hashRefreshToken hashes the refresh token", async () => {

        const refreshToken = "sample-refresh-token"

        const hashedToken = await hashRefreshToken(refreshToken)

        expect(hashedToken).toBeDefined()
        expect(typeof hashedToken).toBe("string")

        expect(hashedToken).not.toBe(refreshToken)

    })


    // REFRESH TOKEN COMPARISON

    test("compareRefreshToken returns true for correct refresh token", async () => {

        const refreshToken = "sample-refresh-token"

        const hashedToken = await hashRefreshToken(refreshToken)

        const isMatch = await compareRefreshToken(
            refreshToken,
            hashedToken
        )

        expect(isMatch).toBe(true)

    })


    test("compareRefreshToken returns false for incorrect refresh token", async () => {

        const refreshToken = "sample-refresh-token"

        const hashedToken = await hashRefreshToken(refreshToken)

        const isMatch = await compareRefreshToken(
            "wrong-refresh-token",
            hashedToken
        )

        expect(isMatch).toBe(false)

    })

})
