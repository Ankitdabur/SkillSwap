import mongoose from "mongoose"


const reviewSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true,
            immutable: true
        },

        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true
        },

        reviewedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            validate: {
                validator: function(reviewedUser){
                    return !this.reviewer || !reviewedUser.equals(this.reviewer)
                },
                message: "Reviewer and reviewed user must be different users"
            }
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            immutable: true,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be an integer"
            }
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
            immutable: true
        }
    },
    {
        timestamps: true
    }
)


reviewSchema.index(
    {
        session: 1,
        reviewer: 1
    },
    {
        unique: true
    }
)

reviewSchema.index({
    reviewedUser: 1,
    createdAt: -1,
    _id: -1
})


const Review = mongoose.model("Review", reviewSchema)


export default Review
