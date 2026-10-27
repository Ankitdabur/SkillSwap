import mongoose from "mongoose"
import Notification from "../../../src/models/notification.model.js"
import { NOTIFICATION_TYPES } from "../../../src/constants/enums.js"


describe("Notification Model", () => {

    const createNotificationData = (overrides = {}) => ({
        recipient: new mongoose.Types.ObjectId(),
        type: NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
        message: "You received a Match request",
        ...overrides
    })


    const getValidationError = async (notification) => {

        try {
            await notification.validate()
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


    // VALID NOTIFICATION


    test("Valid Notification passes validation", async () => {

        const notification = new Notification(
            createNotificationData()
        )

        await expect(
            notification.validate()
        ).resolves.toBeUndefined()

    })


    // RECIPIENT


    test("Recipient is required", async () => {

        const data = createNotificationData()

        delete data.recipient

        const notification = new Notification(data)

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "recipient")).toBe(true)

    })


    test("Recipient references the User model", () => {

        const recipientPath = Notification.schema.path("recipient")

        expect(recipientPath.options.ref).toBe("User")

    })


    test("Recipient is immutable", () => {

        const recipientPath = Notification.schema.path("recipient")

        expect(recipientPath.options.immutable).toBe(true)

    })


    test("Invalid recipient id is rejected", async () => {

        const notification = new Notification(
            createNotificationData({
                recipient: "invalid-user-id"
            })
        )

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "recipient")).toBe(true)

    })


    // TYPE


    test("Type is required", async () => {

        const data = createNotificationData()

        delete data.type

        const notification = new Notification(data)

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "type")).toBe(true)

    })


    test("Finalized notification types are accepted", async () => {

        for(const type of Object.values(NOTIFICATION_TYPES)){

            const notification = new Notification(
                createNotificationData({type})
            )

            await expect(
                notification.validate()
            ).resolves.toBeUndefined()

        }

    })


    test("Invalid notification type is rejected", async () => {

        const notification = new Notification(
            createNotificationData({
                type: "INVALID_NOTIFICATION_TYPE"
            })
        )

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "type")).toBe(true)

    })


    test("Type is immutable", () => {

        const typePath = Notification.schema.path("type")

        expect(typePath.options.immutable).toBe(true)

    })


    // MESSAGE


    test("Message is required", async () => {

        const data = createNotificationData()

        delete data.message

        const notification = new Notification(data)

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "message")).toBe(true)

    })


    test("Empty message is rejected", async () => {

        const notification = new Notification(
            createNotificationData({
                message: "   "
            })
        )

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "message")).toBe(true)

    })


    test("Message is trimmed", () => {

        const notification = new Notification(
            createNotificationData({
                message: "   Notification message   "
            })
        )

        expect(notification.message).toBe("Notification message")

    })


    test("Message is immutable", () => {

        const messagePath = Notification.schema.path("message")

        expect(messagePath.options.immutable).toBe(true)

    })


    // IS READ


    test("Is read defaults to false", () => {

        const notification = new Notification(
            createNotificationData()
        )

        expect(notification.isRead).toBe(false)

    })


    test("Is read accepts true", async () => {

        const notification = new Notification(
            createNotificationData({
                isRead: true
            })
        )

        await expect(
            notification.validate()
        ).resolves.toBeUndefined()

        expect(notification.isRead).toBe(true)

    })


    test("Invalid is read value is rejected", async () => {

        const notification = new Notification(
            createNotificationData({
                isRead: "invalid-boolean"
            })
        )

        const error = await getValidationError(notification)

        expect(error).toBeDefined()
        expect(hasFieldError(error, "isRead")).toBe(true)

    })


    test("Is read is required", () => {

        const isReadPath = Notification.schema.path("isRead")

        expect(isReadPath.options.required).toBe(true)

    })


    // INDEXES


    test("Notification has recipient read state and creation time index", () => {

        const indexes = Notification.schema.indexes()

        const readStateIndex = indexes.find(
            ([fields]) =>
                fields.recipient === 1 &&
                fields.isRead === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1
        )

        expect(readStateIndex).toBeDefined()

    })


    test("Notification has recipient and creation time index", () => {

        const indexes = Notification.schema.indexes()

        const notificationListIndex = indexes.find(
            ([fields]) =>
                fields.recipient === 1 &&
                fields.createdAt === -1 &&
                fields._id === -1 &&
                fields.isRead === undefined
        )

        expect(notificationListIndex).toBeDefined()

    })


    // TIMESTAMPS


    test("Notification schema uses timestamps", () => {

        expect(Notification.schema.options.timestamps).toBe(true)

    })

})
