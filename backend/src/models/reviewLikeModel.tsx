import mongoose, { Document, Schema } from "mongoose";

export interface IReviewLike extends Document {
    reviewId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const reviewLikeSchema = new Schema<IReviewLike>(
    {
        reviewId: { 
            type: Schema.Types.ObjectId, 
            ref: "Review", 
            required: true 
        },

        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
    },
    { 
        timestamps: { 
            createdAt: true, 
            updatedAt: false 
        } 
    }
);

reviewLikeSchema.index(
    { reviewId: 1, userId: 1 }, 
    { unique: true }
);

export const ReviewLike = mongoose.model<IReviewLike>("ReviewLike", reviewLikeSchema);
