import mongoose from "mongoose"
import { MATCH_STATUSES } from "../constants/enums.js"


const matchSchema = new mongoose.Schema(
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

        pairKey: {
            type: String,
            required: true,
            immutable: true,
            select: false
        },

        status: {
            type: String,
            enum: Object.values(MATCH_STATUSES),
            default: MATCH_STATUSES.PENDING,
            required: true
        },

        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            required: function(){
                return this.status === MATCH_STATUSES.BLOCKED
            },
            validate: {
                validator: function(blockedBy){
                    if(this.status === MATCH_STATUSES.BLOCKED){
                        return (
                            blockedBy?.equals(this.sender) ||
                            blockedBy?.equals(this.receiver)
                        )
                    }

                    return blockedBy === null
                },
                message: "Blocked by must be a Match participant only when status is BLOCKED"
            }
        }
    },
    {
        timestamps: true
    }
)


matchSchema.pre("validate", function(){
    if(this.isNew && this.sender && this.receiver){
        this.pairKey = [
            this.sender.toString(),
            this.receiver.toString()
        ]
            .sort()
            .join(":")
    }
})


matchSchema.index(
    {
        pairKey: 1
    },
    {
        unique: true
    }
)

matchSchema.index({
    sender: 1,
    status: 1,
    createdAt: -1
})

matchSchema.index({
    receiver: 1,
    status: 1,
    createdAt: -1
})


const Match = mongoose.model("Match", matchSchema)


export default Match
