import mongoose from "mongoose"
import {
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES
} from "../constants/enums.js"


const skillRequestSchema = new mongoose.Schema(
    {
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index : 1
        },

        category: {
            type: String,
            required: true,
            enum: Object.values(SKILL_CATEGORIES)
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            required: true,
            enum: Object.values(SKILL_REQUEST_STATUSES),
            default: SKILL_REQUEST_STATUSES.PENDING
        },

        adminResponse: {
            type: String,
            trim: true,
            default: null,
            validate : {
                validator : function(adminResponse){
                    if(this.status === SKILL_REQUEST_STATUSES.REJECTED){
                        if(adminResponse){
                            return true
                        }

                        return false
                    }
                    return true
                },
                message : "Rejected SkillRequest must have adminResponse"
            }
        }
    },
    {
        timestamps: true
    }
)


skillRequestSchema.index({
    status: 1,
    createdAt: -1
})

skillRequestSchema.index({
    requestedBy: 1,
    status: 1,
    createdAt: -1
})


const SkillRequest = mongoose.model("SkillRequest" , skillRequestSchema)


export default SkillRequest
