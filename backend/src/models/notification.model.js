import mongoose from "mongoose"
import { NOTIFICATION_TYPES } from "../constants/enums.js"


const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: true,
            immutable: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        },

        isRead: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
)


notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1,
    _id: -1
})

notificationSchema.index({
    recipient: 1,
    createdAt: -1,
    _id: -1
})


const Notification = mongoose.model("Notification", notificationSchema)


export default Notification
