import mongoose, {Document, Schema} from "mongoose";

export interface IReview extends Document{
    userId: mongoose.Types.ObjectId,
    mangaId: mongoose.Types.ObjectId,
    rating: number,
    content: string,
    likesCount: number,
    createdAt: Date,
    updatedAt: Date
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

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 500
        },

        likesCount: {
            type: Number,
            defalut: 0,
            min: 0
        }
    },{
        timestamps: true
    }
);

reviewSchema.index({
    mangaId: 1,
    createdAt: -1
});

reviewSchema.index({
    userId: 1,
    createdAt: -1
});

export const Review = mongoose.model<IReview>("Review", reviewSchema);