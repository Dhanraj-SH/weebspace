import mongoose, {Schema, Document} from "mongoose";

export interface IChapter extends Document {
    mangaId: mongoose.Types.ObjectId,
    chapterNumber: number,
    title?: string,
    pages: string[],
    viewCount: number,
    publishedAt?: Date,
    createdAt: Date,
    updatedAt: Date
}

const chapterSchema = new Schema<IChapter>(
    {
        mangaId: {
            type: Schema.Types.ObjectId,
            ref: "Manga",
            required: true
        },

        chapterNumber: {
            type: Number,
            required: true,
            min: 1
        },

        title: {
            type: String,
            trim: true
        },

        pages: {
            type: [String],
            default:[]
        },

        viewCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        publishedAt: {
            type: Date
        },
    },{
        timestamps: true,
    }
);

chapterSchema.index(
    { mangaId: 1, chapterNumber: 1},
    {unique: true}
);

export const Chapter = mongoose.model<IChapter>("Chapter", chapterSchema);