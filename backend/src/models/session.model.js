import mongoose from "mongoose"
import {
    COMPLETION_METHODS,
    SESSION_COMPLETION_RESPONSES,
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../constants/enums.js"


const sessionSchema = new mongoose.Schema(
    {
        recurringSchedule: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RecurringSchedule",
            default: null,
            immutable: true
        },

        scheduledAt: {
            type: Date,
            required: true,
            immutable: true,
            validate: {
                validator: function(scheduledAt){
                    return !this.isNew || scheduledAt > new Date()
                },
                message: "Session must be scheduled in the future"
            }
        },

        duration: {
            type: Number,
            required: true,
            enum: Object.values(SESSION_DURATIONS),
            immutable: true
        },

        credits: {
            type: Number,
            required: true,
            immutable: true,
            validate: {
                validator: function(credits){
                    if(!Number.isInteger(credits)){
                        return false
                    }

                    if(this.sessionType === SESSION_TYPES.DEMO){
                        return credits === 0
                    }

                    return credits > 0
                },
                message: "Demo Sessions require zero credits and Regular Sessions require positive whole-number credits"
            }
        },

        teacherResponse: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null
        },

        status: {
            type: String,
            enum: Object.values(SESSION_STATUSES),
            default: SESSION_STATUSES.PENDING,
            required: true
        },

        sessionType: {
            type: String,
            enum: Object.values(SESSION_TYPES),
            default: SESSION_TYPES.REGULAR,
            required: true,
            immutable: true
        },

        meetingLink: {
            type: String,
            trim: true,
            default: null,
            required: function(){
                return ![
                    SESSION_STATUSES.PENDING,
                    SESSION_STATUSES.REJECTED
                ].includes(this.status)
            },
            validate: {
                validator: function(meetingLink){
                    if(meetingLink === null || meetingLink === undefined){
                        return true
                    }

                    try{
                        return new URL(meetingLink).protocol === "https:"
                    }catch{
                        return false
                    }
                },
                message: "Meeting link must be a valid HTTPS URL"
            }
        },

        completionMethod: {
            type: String,
            enum: Object.values(COMPLETION_METHODS),
            default: null,
            required: function(){
                return this.get("status") === SESSION_STATUSES.COMPLETED
            },
            validate: {
                validator: function(completionMethod){
                    if(this.get("status") === SESSION_STATUSES.COMPLETED){
                        return completionMethod !== null
                    }

                    return completionMethod === null
                },
                message: "Completion method is allowed only for completed Sessions"
            }
        },

        teacherCompletionResponse: {
            type: String,
            enum: [
                SESSION_COMPLETION_RESPONSES.CONFIRMED,
                SESSION_COMPLETION_RESPONSES.DID_NOT_HAPPEN
            ],
            default: null
        },

        teacherRespondedAt: {
            type: Date,
            default: null
        },

        learnerCompletionResponse: {
            type: String,
            enum: Object.values(SESSION_COMPLETION_RESPONSES),
            default: null
        },

        learnerRespondedAt: {
            type: Date,
            default: null
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            validate: {
                validator: function(learner){
                    return !this.teacher || !learner.equals(this.teacher)
                },
                message: "Teacher and learner must be different users"
            }
        },

        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
            immutable: true
        }
    },
    {
        timestamps: true
    }
)


sessionSchema.index({
    teacher: 1,
    scheduledAt: 1
})

sessionSchema.index({
    learner: 1,
    scheduledAt: 1
})

sessionSchema.index({
    status: 1,
    scheduledAt: 1
})

sessionSchema.index({
    recurringSchedule: 1,
    scheduledAt: 1
})

sessionSchema.index({
    teacher: 1,
    skill: 1,
    sessionType: 1,
    status: 1
})


const Session = mongoose.model("Session", sessionSchema)


export default Session
