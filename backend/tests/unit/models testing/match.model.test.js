import mongoose from "mongoose"
import Match from "../../../src/models/match.model.js"
import { MATCH_STATUSES } from "../../../src/constants/enums.js"


describe("Match Model", () => {

    const createMatchData = (overrides = {}) => ({
        sender: new mongoose.Types.ObjectId(),
        receiver: new mongoose.Types.ObjectId(),
        ...overrides
    })


    const getValidationError = async (match) => {

        try {
            await match.validate()
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


    // VALID MATCH


    test("Valid Match passes validation", async () => {

        const match = new Match(createMatchData())

        await expect(match.validate()).resolves.toBeUndefined()

    })


    // SENDER


    test("Sender is required", async () => {

        const data = createMatchData()

        delete data.sender

        const match = new Match(data)

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "sender")).toBe(true)

    })


    test("Sender references the User model", () => {

        const senderPath = Match.schema.path("sender")

        expect(senderPath.options.ref).toBe("User")

    })


    test("Sender is immutable", () => {

        const senderPath = Match.schema.path("sender")

        expect(senderPath.options.immutable).toBe(true)

    })


    // RECEIVER


    test("Receiver is required", async () => {

        const data = createMatchData()

        delete data.receiver

        const match = new Match(data)

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "receiver")).toBe(true)

    })


    test("Receiver references the User model", () => {

        const receiverPath = Match.schema.path("receiver")

        expect(receiverPath.options.ref).toBe("User")

    })


    test("Receiver is immutable", () => {

        const receiverPath = Match.schema.path("receiver")

        expect(receiverPath.options.immutable).toBe(true)

    })


    test("Sender and receiver must be different users", async () => {

        const userId = new mongoose.Types.ObjectId()

        const match = new Match(
            createMatchData({
                sender: userId,
                receiver: userId
            })
        )

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "receiver")).toBe(true)
        expect(error.errors.receiver.message).toBe(
            "Sender and receiver must be different users"
        )

    })


    // PAIR KEY


    test("Pair key is generated using sorted participant ids", async () => {

        const sender = new mongoose.Types.ObjectId(
            "000000000000000000000002"
        )

        const receiver = new mongoose.Types.ObjectId(
            "000000000000000000000001"
        )

        const match = new Match(
            createMatchData({
                sender,
                receiver
            })
        )

        await match.validate()

        expect(match.pairKey).toBe(
            "000000000000000000000001:000000000000000000000002"
        )

    })


    test("Reversed participants generate the same pair key", async () => {

        const firstUser = new mongoose.Types.ObjectId()
        const secondUser = new mongoose.Types.ObjectId()

        const firstMatch = new Match(
            createMatchData({
                sender: firstUser,
                receiver: secondUser
            })
        )

        const secondMatch = new Match(
            createMatchData({
                sender: secondUser,
                receiver: firstUser
            })
        )

        await firstMatch.validate()
        await secondMatch.validate()

        expect(firstMatch.pairKey).toBe(secondMatch.pairKey)

    })


    test("Pair key is required immutable and excluded by default", () => {

        const pairKeyPath = Match.schema.path("pairKey")

        expect(pairKeyPath.options.required).toBe(true)
        expect(pairKeyPath.options.immutable).toBe(true)
        expect(pairKeyPath.options.select).toBe(false)

    })


    // STATUS


    test("Status defaults to PENDING", () => {

        const match = new Match(createMatchData())

        expect(match.status).toBe(MATCH_STATUSES.PENDING)

    })


    test("Finalized Match statuses are accepted", async () => {

        for(const status of Object.values(MATCH_STATUSES)){

            const data = createMatchData({status})

            if(status === MATCH_STATUSES.BLOCKED){
                data.blockedBy = data.sender
            }

            const match = new Match(data)

            await expect(match.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid status is rejected", async () => {

        const match = new Match(
            createMatchData({
                status: "INVALID_STATUS"
            })
        )

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "status")).toBe(true)

    })


    // BLOCKED BY


    test("Blocked by defaults to null", () => {

        const match = new Match(createMatchData())

        expect(match.blockedBy).toBeNull()

    })


    test("Blocked by references the User model", () => {

        const blockedByPath = Match.schema.path("blockedBy")

        expect(blockedByPath.options.ref).toBe("User")

    })


    test("Blocked Match requires blocked by", async () => {

        const match = new Match(
            createMatchData({
                status: MATCH_STATUSES.BLOCKED
            })
        )

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "blockedBy")).toBe(true)

    })


    test("Blocked by accepts the sender", async () => {

        const data = createMatchData({
            status: MATCH_STATUSES.BLOCKED
        })

        data.blockedBy = data.sender

        const match = new Match(data)

        await expect(match.validate()).resolves.toBeUndefined()

    })


    test("Blocked by accepts the receiver", async () => {

        const data = createMatchData({
            status: MATCH_STATUSES.BLOCKED
        })

        data.blockedBy = data.receiver

        const match = new Match(data)

        await expect(match.validate()).resolves.toBeUndefined()

    })


    test("Blocked by rejects a user who is not a participant", async () => {

        const match = new Match(
            createMatchData({
                status: MATCH_STATUSES.BLOCKED,
                blockedBy: new mongoose.Types.ObjectId()
            })
        )

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "blockedBy")).toBe(true)
        expect(error.errors.blockedBy.message).toBe(
            "Blocked by must be a Match participant only when status is BLOCKED"
        )

    })


    test("Non-blocked Match rejects blocked by", async () => {

        const data = createMatchData()

        data.blockedBy = data.sender

        const match = new Match(data)

        const error = await getValidationError(match)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "blockedBy")).toBe(true)

    })


    // INDEXES


    test("Match has a unique pair key index", () => {

        const indexes = Match.schema.indexes()

        const pairKeyIndex = indexes.find(
            ([fields]) => fields.pairKey === 1
        )

        expect(pairKeyIndex).toBeDefined()
        expect(pairKeyIndex[1].unique).toBe(true)

    })


    test("Match has sender status and creation time index", () => {

        const indexes = Match.schema.indexes()

        const senderIndex = indexes.find(
            ([fields]) =>
                fields.sender === 1 &&
                fields.status === 1 &&
                fields.createdAt === -1 &&
                fields.receiver === undefined
        )

        expect(senderIndex).toBeDefined()

    })


    test("Match has receiver status and creation time index", () => {

        const indexes = Match.schema.indexes()

        const receiverIndex = indexes.find(
            ([fields]) =>
                fields.receiver === 1 &&
                fields.status === 1 &&
                fields.createdAt === -1 &&
                fields.sender === undefined
        )

        expect(receiverIndex).toBeDefined()

    })


    // TIMESTAMPS


    test("Match schema has timestamps enabled", () => {

        expect(Match.schema.options.timestamps).toBe(true)

    })

})
