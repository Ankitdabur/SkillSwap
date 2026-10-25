import mongoose from "mongoose"
import Message from "../../../src/models/message.model.js"
import { MESSAGE_TYPES } from "../../../src/constants/enums.js"


describe("Message Model", () => {

    const createMessageData = (overrides = {}) => ({
        sender: new mongoose.Types.ObjectId(),
        receiver: new mongoose.Types.ObjectId(),
        content: "Test message",
        ...overrides
    })


    const getValidationError = async (message) => {

        try {
            await message.validate()
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


    // VALID MESSAGE


    test("Valid Message passes validation", async () => {

        const message = new Message(createMessageData())

        await expect(message.validate()).resolves.toBeUndefined()

    })


    // SENDER


    test("Sender is required", async () => {

        const data = createMessageData()

        delete data.sender

        const message = new Message(data)

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "sender")).toBe(true)

    })


    test("Sender references the User model", () => {

        const senderPath = Message.schema.path("sender")

        expect(senderPath.options.ref).toBe("User")

    })


    test("Sender is immutable", () => {

        const senderPath = Message.schema.path("sender")

        expect(senderPath.options.immutable).toBe(true)

    })


    test("Invalid sender id is rejected", async () => {

        const message = new Message(
            createMessageData({
                sender: "invalid-user-id"
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "sender")).toBe(true)

    })


    // RECEIVER


    test("Receiver is required", async () => {

        const data = createMessageData()

        delete data.receiver

        const message = new Message(data)

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "receiver")).toBe(true)

    })


    test("Receiver references the User model", () => {

        const receiverPath = Message.schema.path("receiver")

        expect(receiverPath.options.ref).toBe("User")

    })


    test("Receiver is immutable", () => {

        const receiverPath = Message.schema.path("receiver")

        expect(receiverPath.options.immutable).toBe(true)

    })


    test("Invalid receiver id is rejected", async () => {

        const message = new Message(
            createMessageData({
                receiver: "invalid-user-id"
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "receiver")).toBe(true)

    })


    test("Sender and receiver must be different users", async () => {

        const userId = new mongoose.Types.ObjectId()

        const message = new Message(
            createMessageData({
                sender: userId,
                receiver: userId
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "receiver")).toBe(true)
        expect(error.errors.receiver.message).toBe(
            "Sender and receiver must be different users"
        )

    })


    // CONVERSATION KEY


    test("Conversation key is generated using sorted participant ids", async () => {

        const sender = new mongoose.Types.ObjectId(
            "000000000000000000000002"
        )

        const receiver = new mongoose.Types.ObjectId(
            "000000000000000000000001"
        )

        const message = new Message(
            createMessageData({
                sender,
                receiver
            })
        )

        await message.validate()

        expect(message.conversationKey).toBe(
            "000000000000000000000001:000000000000000000000002"
        )

    })


    test("Reversed participants generate the same conversation key", async () => {

        const firstUser = new mongoose.Types.ObjectId()
        const secondUser = new mongoose.Types.ObjectId()

        const firstMessage = new Message(
            createMessageData({
                sender: firstUser,
                receiver: secondUser
            })
        )

        const secondMessage = new Message(
            createMessageData({
                sender: secondUser,
                receiver: firstUser
            })
        )

        await firstMessage.validate()
        await secondMessage.validate()

        expect(firstMessage.conversationKey).toBe(
            secondMessage.conversationKey
        )

    })


    test("Conversation key is required immutable and excluded by default", () => {

        const conversationKeyPath = Message.schema.path("conversationKey")

        expect(conversationKeyPath.options.required).toBe(true)
        expect(conversationKeyPath.options.immutable).toBe(true)
        expect(conversationKeyPath.options.select).toBe(false)

    })


    // MESSAGE TYPE


    test("Message type defaults to TEXT", () => {

        const message = new Message(createMessageData())

        expect(message.messageType).toBe(MESSAGE_TYPES.TEXT)

    })


    test("Finalized Message types are accepted", async () => {

        for(const messageType of Object.values(MESSAGE_TYPES)){

            const message = new Message(
                createMessageData({messageType})
            )

            await expect(message.validate()).resolves.toBeUndefined()

        }

    })


    test("Invalid Message type is rejected", async () => {

        const message = new Message(
            createMessageData({
                messageType: "INVALID_MESSAGE_TYPE"
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "messageType")).toBe(true)

    })


    test("Message type is required and immutable", () => {

        const messageTypePath = Message.schema.path("messageType")

        expect(messageTypePath.options.required).toBe(true)
        expect(messageTypePath.options.immutable).toBe(true)

    })


    // CONTENT


    test("Content is required", async () => {

        const data = createMessageData()

        delete data.content

        const message = new Message(data)

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "content")).toBe(true)

    })


    test("Empty content is rejected", async () => {

        const message = new Message(
            createMessageData({
                content: "   "
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "content")).toBe(true)

    })


    test("Content is trimmed", () => {

        const message = new Message(
            createMessageData({
                content: "   Test message   "
            })
        )

        expect(message.content).toBe("Test message")

    })


    test("Content is immutable", () => {

        const contentPath = Message.schema.path("content")

        expect(contentPath.options.immutable).toBe(true)

    })


    // IS READ


    test("Is read defaults to false", () => {

        const message = new Message(createMessageData())

        expect(message.isRead).toBe(false)

    })


    test("Is read accepts true", async () => {

        const message = new Message(
            createMessageData({
                isRead: true
            })
        )

        await expect(message.validate()).resolves.toBeUndefined()

        expect(message.isRead).toBe(true)

    })


    test("Invalid is read value is rejected", async () => {

        const message = new Message(
            createMessageData({
                isRead: "invalid-boolean"
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "isRead")).toBe(true)

    })


    test("Is read is required", () => {

        const isReadPath = Message.schema.path("isRead")

        expect(isReadPath.options.required).toBe(true)

    })


    // IS DELETED


    test("Is deleted defaults to false", () => {

        const message = new Message(createMessageData())

        expect(message.isDeleted).toBe(false)

    })


    test("Is deleted accepts true", async () => {

        const message = new Message(
            createMessageData({
                isDeleted: true
            })
        )

        await expect(message.validate()).resolves.toBeUndefined()

        expect(message.isDeleted).toBe(true)

    })


    test("Invalid is deleted value is rejected", async () => {

        const message = new Message(
            createMessageData({
                isDeleted: "invalid-boolean"
            })
        )

        const error = await getValidationError(message)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "isDeleted")).toBe(true)

    })


    test("Is deleted is required", () => {

        const isDeletedPath = Message.schema.path("isDeleted")

        expect(isDeletedPath.options.required).toBe(true)

    })


    // INDEXES


    test("Message has conversation key creation time and id index", () => {

        const indexes = Message.schema.indexes()

        const conversationIndex = indexes.find(
            ([fields]) =>
                fields.conversationKey === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(conversationIndex).toBeDefined()

    })


    // TIMESTAMPS


    test("Message schema has timestamps enabled", () => {

        expect(Message.schema.options.timestamps).toBe(true)

    })

})
