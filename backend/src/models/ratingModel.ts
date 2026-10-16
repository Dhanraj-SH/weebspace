import mongoose, {Schema, Document} from "mongoose";

export interface IRating extends Document{
    userId: mongoose.Types.ObjectId,
    mangaId: mongoose.Types.ObjectId,
    value: number,
    createdAt: Date,
    updatedAt: Date
}

const ratingSchema = new Schema<IRating>(
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

        value: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    },{
        timestamps: true
    }
);

ratingSchema.index(
    {userId: 1, mangaId: 1},
    {unique: true}
);

ratingSchema.index({
    mangaId: 1
});

export const Rating = mongoose.model<IRating>("Rating", ratingSchema);