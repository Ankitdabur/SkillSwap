import mongoose from "mongoose"
import { MESSAGE_TYPES } from "../constants/enums.js"


const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            validate: {
                validator: function(receiver){
                    return !this.sender || !receiver.equals(this.sender)
                },
                message: "Sender and receiver must be different users"
            }
        },

        conversationKey: {
            type: String,
            required: true,
            immutable: true,
            select: false
        },

        messageType: {
            type: String,
            enum: Object.values(MESSAGE_TYPES),
            default: MESSAGE_TYPES.TEXT,
            required: true,
            immutable: true
        },

        content: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        },

        isRead: {
            type: Boolean,
            required: true,
            default: false
        },

        isDeleted: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
)


messageSchema.pre("validate", function(){
    if(this.isNew && this.sender && this.receiver){
        this.conversationKey = [
            this.sender.toString(),
            this.receiver.toString()
        ]
            .sort()
            .join(":")
    }
})


messageSchema.index({
    conversationKey: 1,
    createdAt: -1,
    _id: -1
})


const Message = mongoose.model("Message", messageSchema)


export default Message
