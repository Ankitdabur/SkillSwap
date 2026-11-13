import axios from "axios"
import mongoose from "mongoose"
import app from "../../../src/app.js"
import { dbconnect } from "../../../src/db/index.js"
import { generateAccessToken } from "../../../src/utils/token.js"
import {
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES
} from "../../../src/constants/enums.js"
import { ERROR_CODES } from "../../../src/constants/errorCodes.js"
import {
    createTestCreditTransaction,
    createTestLearner,
    createTestTeacher
} from "../../helpers/createTestUser.js"
import { authHeader } from "../../helpers/authHeader.js"
import {
    cleanupTestCreditTransactions,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js"




const PORT = process.env.PORT || 8000
const CREDIT_TRANSACTIONS_URL =
    `http://localhost:${PORT}/api/v1/credit-transactions`

let server


const getMyCreditTransactions = async (
    accessToken,
    query = ""
) => {
    try {
        return await axios.get(
            `${CREDIT_TRANSACTIONS_URL}/me${query}`,
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
    await cleanupTestCreditTransactions()
    await cleanupTestUsers()
})


afterAll(async () => {
    await cleanupTestCreditTransactions()
    await cleanupTestUsers()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
})


describe("Get My CreditTransactions", () => {

    test("User can get only their CreditTransactions with cursor pagination", async () => {
        const {user} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const firstCreditTransaction = await createTestCreditTransaction(
            user._id,
            new mongoose.Types.ObjectId(),
            -10
        )

        const secondCreditTransaction = await createTestCreditTransaction(
            user._id,
            null,
            25,
            {
                type: CREDIT_TRANSACTION_TYPES.ADMIN_BONUS,
                status: CREDIT_TRANSACTION_STATUSES.COMPLETED,
                description: "Admin bonus"
            }
        )

        const thirdCreditTransaction = await createTestCreditTransaction(
            user._id,
            null,
            -5,
            {
                type: CREDIT_TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
                status: CREDIT_TRANSACTION_STATUSES.CANCELLED,
                description: "Admin adjustment"
            }
        )

        await createTestCreditTransaction(
            otherUser._id,
            new mongoose.Types.ObjectId(),
            10
        )

        const firstResponse = await getMyCreditTransactions(
            accessToken,
            "?limit=1"
        )

        expect(firstResponse.status).toBe(200)
        expect(firstResponse.data.success).toBe(true)
        expect(firstResponse.data.message).toBe(
            "CreditTransactions fetched successfully"
        )
        expect(
            firstResponse.data.data.creditTransactions
        ).toHaveLength(1)
        expect(
            firstResponse.data.data.creditTransactions[0]._id
        ).toBe(thirdCreditTransaction._id.toString())
        expect(firstResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: thirdCreditTransaction._id.toString(),
            hasMore: true
        })

        const secondResponse = await getMyCreditTransactions(
            accessToken,
            `?cursor=${thirdCreditTransaction._id}&limit=1`
        )

        expect(secondResponse.status).toBe(200)
        expect(
            secondResponse.data.data.creditTransactions[0]._id
        ).toBe(secondCreditTransaction._id.toString())
        expect(secondResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: secondCreditTransaction._id.toString(),
            hasMore: true
        })

        const thirdResponse = await getMyCreditTransactions(
            accessToken,
            `?cursor=${secondCreditTransaction._id}&limit=1`
        )

        expect(thirdResponse.status).toBe(200)
        expect(
            thirdResponse.data.data.creditTransactions[0]._id
        ).toBe(firstCreditTransaction._id.toString())
        expect(thirdResponse.data.data.pagination).toEqual({
            limit: 1,
            nextCursor: null,
            hasMore: false
        })
    })


    test("User cannot use another user's CreditTransaction as cursor", async () => {
        const {user} = await createTestLearner()
        const {user: otherUser} = await createTestTeacher()
        const accessToken = generateAccessToken(user._id)

        const otherCreditTransaction = await createTestCreditTransaction(
            otherUser._id,
            new mongoose.Types.ObjectId(),
            10
        )

        const response = await getMyCreditTransactions(
            accessToken,
            `?cursor=${otherCreditTransaction._id}`
        )

        expect(response.status).toBe(400)
        expect(response.data.code).toBe(
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    })


    test("User without CreditTransactions receives an empty list", async () => {
        const {user} = await createTestLearner()
        const accessToken = generateAccessToken(user._id)

        const response = await getMyCreditTransactions(accessToken)

        expect(response.status).toBe(200)
        expect(response.data.data.creditTransactions).toEqual([])
        expect(response.data.data.pagination).toEqual({
            limit: 10,
            nextCursor: null,
            hasMore: false
        })
    })


    test("User cannot get CreditTransactions without access token", async () => {
        const response = await getMyCreditTransactions()

        expect(response.status).toBe(401)
        expect(response.data.code).toBe(
            ERROR_CODES.AUTHENTICATION_REQUIRED
        )
    })

})
