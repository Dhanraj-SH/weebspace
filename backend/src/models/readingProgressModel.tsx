import mongoose, {Schema, Document} from "mongoose";
import { Chapter } from "./chapterModel.js";

export interface IReadingProgress extends Document{
    userId: mongoose.Types.ObjectId,
    mangaId: mongoose.Types.ObjectId,
    chapterId: mongoose.Types.ObjectId,
    pageNumber: number,
    completed: boolean,
    lastReadAt: Date,
    updatedAt: Date
}

const readingProgessSchema = new Schema<IReadingProgress>(
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

        chapterId: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: true
        },

        pageNumber: {
            type: Number,
            required: true,
            min:1
        },

        completed: {
            type: Boolean,
            default: false
        },

        lastReadAt: {
            type: Date,
            default: Date.now
        }
    },{
        timestamps: true
    }
);

readingProgessSchema.index(
    {userId: 1, mangaId: 1},
    {unique: true}
);

readingProgessSchema.index({
    userId: 1,
    chapterId: 1
});

export const ReadingProgress = mongoose.model<IReadingProgress>("ReadingProgress", readingProgessSchema);