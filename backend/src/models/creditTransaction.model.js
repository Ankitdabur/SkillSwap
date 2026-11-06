import mongoose from "mongoose"
import {
    CREDIT_TRANSACTION_STATUSES,
    CREDIT_TRANSACTION_TYPES
} from "../constants/enums.js"


const creditTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            default: null,
            immutable: true,
            required: function(){
                return this.type === CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT
            },
            validate: {
                validator: function(session){
                    if(this.type === CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT){
                        return session !== null && session !== undefined
                    }

                    return session === null || session === undefined
                },
                message: "Session is required only for Session payment transactions"
            }
        },

        amount: {
            type: Number,
            required: true,
            immutable: true,
            validate: {
                validator: function(amount){
                    return Number.isInteger(amount) && amount !== 0
                },
                message: "Credit transaction amount must be a non-zero integer"
            }
        },

        type: {
            type: String,
            enum: Object.values(CREDIT_TRANSACTION_TYPES),
            required: true,
            immutable: true
        },

        status: {
            type: String,
            enum: Object.values(CREDIT_TRANSACTION_STATUSES),
            default: CREDIT_TRANSACTION_STATUSES.PENDING,
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
            immutable: true
        }
    },
    {
        timestamps: true
    }
)


creditTransactionSchema.index({
    user: 1,
    createdAt: -1,
    _id: -1
})

creditTransactionSchema.index(
    {
        session: 1,
        user: 1,
        type: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            type: CREDIT_TRANSACTION_TYPES.SESSION_PAYMENT
        }
    }
)


const CreditTransaction = mongoose.model(
    "CreditTransaction",
    creditTransactionSchema
)


export default CreditTransaction
