import mongoose from "mongoose"
import { DAYS_OF_WEEK } from "../constants/enums.js"


const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/


const availabilitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        startTime: {
            type: String,
            required: true,
            match: timePattern
        },

        endTime: {
            type: String,
            required: true,
            match: timePattern,
            validate : {
                validator : function(){
                    return this.endTime > this.startTime
                },
                message : "Invalid slot"
            }
        },

        day: {
            type: String,
            enum: Object.values(DAYS_OF_WEEK),
            required: true
        }
    },
    {
        timestamps: true
    }
)


availabilitySchema.index(
    {
        userId: 1,
        day: 1,
        startTime: 1,
        endTime: 1
    },
    {
        unique: true
    }
)


const Availability = mongoose.model("Availability" , availabilitySchema)


export default Availability
