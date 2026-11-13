import mongoose from "mongoose"
import { REPORT_STATUSES } from "../constants/enums.js"


const reportSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            default: null,
            immutable: true,
            validate: {
                validator: function(session){
                    return Boolean(session) !== Boolean(this.message)
                },
                message: "Report must reference either a Session or a Message"
            }
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            validate: {
                validator: function(reportedUser){
                    return !this.reportedBy || !reportedUser.equals(
                        this.reportedBy
                    )
                },
                message: "Reporting and reported users must be different users"
            }
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
            immutable: true
        },

        status: {
            type: String,
            enum: Object.values(REPORT_STATUSES),
            default: REPORT_STATUSES.PENDING,
            required: true
        },

        adminResponse: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
            validate: {
                validator: function(adminResponse){
                    const status = this.get("status")

                    if(status === REPORT_STATUSES.PENDING){
                        return adminResponse === null
                    }

                    return (
                        adminResponse === null ||
                        adminResponse.length > 0
                    )
                },
                message: "Admin response is allowed only for a resolved or dismissed Report"
            }
        },

        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
            immutable: true,
            validate: {
                validator: function(message){
                    return Boolean(message) !== Boolean(this.session)
                },
                message: "Report must reference either a Session or a Message"
            }
        }
    },
    {
        timestamps: true
    }
)


reportSchema.index(
    {
        session: 1,
        reportedBy: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            session: {
                $type: "objectId"
            }
        }
    }
)

reportSchema.index(
    {
        message: 1,
        reportedBy: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            message: {
                $type: "objectId"
            }
        }
    }
)

reportSchema.index({
    reportedBy: 1,
    createdAt: -1,
    _id: -1
})

reportSchema.index({
    status: 1,
    createdAt: -1,
    _id: -1
})


const Report = mongoose.model("Report", reportSchema)


export default Report
