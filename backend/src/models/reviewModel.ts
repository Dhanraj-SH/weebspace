import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
    userId: mongoose.Types.ObjectId;
    mangaId: mongoose.Types.ObjectId;
    content: string;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },

        mangaId: { 
            type: Schema.Types.ObjectId, 
            ref: "Manga", 
            required: true 
        },

        content: { 
            type: String, 
            required: true, 
            trim: true, 
            minlength: 1, 
            maxlength: 5000 
        },

        likesCount: { 
            type: Number, 
            default: 0, 
            min: 0 
        },

    },{ 
        timestamps: true 
    }
);

reviewSchema.index(
    { userId: 1, mangaId: 1 }, 
    { unique: true }
);

reviewSchema.index(
    { mangaId: 1, createdAt: -1 }
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);