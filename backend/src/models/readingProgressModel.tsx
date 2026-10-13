import mongoose, { Schema, Document } from "mongoose";

export interface IReadingProgress extends Document {
    userId: mongoose.Types.ObjectId;
    mangaId: mongoose.Types.ObjectId;
    chapterId: mongoose.Types.ObjectId;
    pageNumber: number;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const readingProgressSchema = new Schema<IReadingProgress>(
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
            min: 1 
        },

        completed: { 
            type: Boolean, 
            default: false 
        },
        
    },{ 
        timestamps: true 
    }
);

readingProgressSchema.index(
    { userId: 1, mangaId: 1 }, 
    { unique: true }
);

readingProgressSchema.index(
    { userId: 1, updatedAt: -1 }
);

readingProgressSchema.index(
    { chapterId: 1 }
);

export const ReadingProgress = mongoose.model<IReadingProgress>("ReadingProgress", readingProgressSchema);
