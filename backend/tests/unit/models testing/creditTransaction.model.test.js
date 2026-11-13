import mongoose from "mongoose"
import CreditTransaction from "../../../src/models/creditTransaction.model.js"
import {
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES
} from "../../../src/constants/enums.js"


describe("CreditTransaction Model", () => {

    const createCreditTransactionData = (overrides = {}) => ({
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        amount: -10,
        type: CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT,
        description: "Credits reserved for Session as learner",
        ...overrides
    })


    const getValidationError = async (creditTransaction) => {

        try {
            await creditTransaction.validate()
            return null
        } catch (error) {
            return error
        }

    }


    const hasFieldError = (error, field) => {

        return Object.keys(error.errors).some(
            (key) => key === field
        )

    }


    // VALID CREDIT TRANSACTION


    test("Valid CreditTransaction passes validation", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData()
        )

        await expect(
            creditTransaction.validate()
        ).resolves.toBeUndefined()

    })


    // USER


    test("User is required", async () => {

        const data = createCreditTransactionData()

        delete data.user

        const error = await getValidationError(
            new CreditTransaction(data)
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "user")).toBe(true)

    })


    test("User references the User model", () => {

        const userPath = CreditTransaction.schema.path("user")

        expect(userPath.options.ref).toBe("User")

    })


    test("User is immutable", () => {

        const userPath = CreditTransaction.schema.path("user")

        expect(userPath.options.immutable).toBe(true)

    })


    test("Invalid user id is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                user: "invalid-user-id"
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "user")).toBe(true)

    })


    // SESSION


    test("Session is required for Session payment", async () => {

        const data = createCreditTransactionData()

        delete data.session

        const error = await getValidationError(
            new CreditTransaction(data)
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "session")).toBe(true)

    })


    test("Session defaults to null for administrative transaction", async () => {

        const data = createCreditTransactionData({
            type: CREDIT_TRANSACTION_TYPES.ADMIN_BONUS,
            amount: 25
        })

        delete data.session

        const creditTransaction = new CreditTransaction(data)

        await expect(
            creditTransaction.validate()
        ).resolves.toBeUndefined()
        expect(creditTransaction.session).toBeNull()

    })


    test("Administrative transaction rejects Session", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                type: CREDIT_TRANSACTION_TYPES.ADMIN_ADJUSTMENT
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "session")).toBe(true)

    })


    test("Session references the Session model and is immutable", () => {

        const sessionPath = CreditTransaction.schema.path("session")

        expect(sessionPath.options.ref).toBe("Session")
        expect(sessionPath.options.immutable).toBe(true)

    })


    test("Invalid Session id is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                session: "invalid-session-id"
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "session")).toBe(true)

    })


    // AMOUNT


    test("Amount is required", async () => {

        const data = createCreditTransactionData()

        delete data.amount

        const error = await getValidationError(
            new CreditTransaction(data)
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "amount")).toBe(true)

    })


    test("Positive and negative whole-number amounts are accepted", async () => {

        for(const amount of [-10, 10]){
            const creditTransaction = new CreditTransaction(
                createCreditTransactionData({amount})
            )

            await expect(
                creditTransaction.validate()
            ).resolves.toBeUndefined()
        }

    })


    test("Zero amount is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({amount: 0})
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "amount")).toBe(true)

    })


    test("Fractional amount is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({amount: 1.5})
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "amount")).toBe(true)

    })


    test("Amount is immutable", () => {

        const amountPath = CreditTransaction.schema.path("amount")

        expect(amountPath.options.immutable).toBe(true)

    })


    // TYPE


    test("Type is required", async () => {

        const data = createCreditTransactionData()

        delete data.type

        const error = await getValidationError(
            new CreditTransaction(data)
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "type")).toBe(true)

    })


    test("Finalized CreditTransaction types are accepted", async () => {

        for(const type of Object.values(CREDIT_TRANSACTION_TYPES)){
            const creditTransaction = new CreditTransaction(
                createCreditTransactionData({
                    type,
                    session: type === CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT
                        ? new mongoose.Types.ObjectId()
                        : null
                })
            )

            await expect(
                creditTransaction.validate()
            ).resolves.toBeUndefined()
        }

    })


    test("Invalid CreditTransaction type is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                type: "INVALID_CREDIT_TRANSACTION_TYPE"
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "type")).toBe(true)

    })


    test("Type is immutable", () => {

        const typePath = CreditTransaction.schema.path("type")

        expect(typePath.options.immutable).toBe(true)

    })


    // STATUS


    test("Status defaults to PENDING", () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData()
        )

        expect(creditTransaction.status).toBe(
            CREDIT_TRANSACTION_STATUSES.PENDING
        )

    })


    test("Finalized CreditTransaction statuses are accepted", async () => {

        for(const status of Object.values(CREDIT_TRANSACTION_STATUSES)){
            const creditTransaction = new CreditTransaction(
                createCreditTransactionData({status})
            )

            await expect(
                creditTransaction.validate()
            ).resolves.toBeUndefined()
        }

    })


    test("Invalid CreditTransaction status is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                status: "INVALID_CREDIT_TRANSACTION_STATUS"
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "status")).toBe(true)

    })


    test("Status is required", () => {

        const statusPath = CreditTransaction.schema.path("status")

        expect(statusPath.options.required).toBe(true)

    })


    // DESCRIPTION


    test("Description is required", async () => {

        const data = createCreditTransactionData()

        delete data.description

        const error = await getValidationError(
            new CreditTransaction(data)
        )

        expect(error).toBeDefined()
        expect(hasFieldError(error, "description")).toBe(true)

    })


    test("Description is trimmed", () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                description: "   Session payment   "
            })
        )

        expect(creditTransaction.description).toBe("Session payment")

    })


    test("Description longer than 500 characters is rejected", async () => {

        const creditTransaction = new CreditTransaction(
            createCreditTransactionData({
                description: "a".repeat(501)
            })
        )

        const error = await getValidationError(creditTransaction)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "description")).toBe(true)

    })


    test("Description is immutable", () => {

        const descriptionPath = CreditTransaction.schema.path("description")

        expect(descriptionPath.options.immutable).toBe(true)

    })


    // INDEXES


    test("CreditTransaction has user creation time and id index", () => {

        const indexes = CreditTransaction.schema.indexes()

        const userHistoryIndex = indexes.find(
            ([fields]) =>
                fields.user === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(userHistoryIndex).toBeDefined()

    })


    test("Session payment index is unique and partial", () => {

        const indexes = CreditTransaction.schema.indexes()

        const sessionPaymentIndex = indexes.find(
            ([fields]) =>
                fields.session === 1 &&
                fields.user === 1 &&
                fields.type === 1
        )

        expect(sessionPaymentIndex).toBeDefined()
        expect(sessionPaymentIndex[1].unique).toBe(true)
        expect(sessionPaymentIndex[1].partialFilterExpression).toEqual({
            type: CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT
        })

    })


    // TIMESTAMPS


    test("CreditTransaction schema uses timestamps", () => {

        expect(CreditTransaction.schema.options.timestamps).toBe(true)

    })

})
