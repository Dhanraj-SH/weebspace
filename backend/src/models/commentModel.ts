import mongoose, {Schema, Document} from "mongoose";

export interface IComment extends Document{
    userId: mongoose.Types.ObjectId,
    mangaId: mongoose.Types.ObjectId,
    chapterId?: mongoose.Types.ObjectId,
    parentCommentId?: mongoose.Types.ObjectId,
    content: string,
    likesCount: number,
    createdAt: Date,
    updatedAt: Date
}

const commentSchema = new Schema<IComment>(
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
            ref: "Chapter"
        },

        parentCommentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },

        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 500
        },

        likesCount:{
            type: Number,
            default: 0,
            min: 0
        }
    },{
        timestamps: true
    }
);

commentSchema.index({
    mangaId: 1,
    createdAt: -1
});

commentSchema.index({
    chapterId: 1,
    createdAt: -1
});

commentSchema.index({
    parentCommentId: 1,
});

export const Comment = mongoose.model<IComment>("Comment", commentSchema);