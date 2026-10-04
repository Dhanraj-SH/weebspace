import mongoose, {Document, Schema} from "mongoose";

export enum LibraryStatus{
    Reading = "reading",
    Completed = "completed",
    PlanToRead = "planToRead",
    Dropped = "dropped"
}

export interface ILibrary extends Document{
    userId: mongoose.Types.ObjectId,
    mangaId: mongoose.Types.ObjectId,
    status: LibraryStatus,
    createdAt: Date,
    updatedAt: Date
}

const librarySchema = new Schema<ILibrary>(
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

        status: {
            type: String,
            enum: Object.values(LibraryStatus),
            default: LibraryStatus.PlanToRead
        }
    },{
        timestamps: true
    }
);

librarySchema.index(
    {userId: 1, mangaId: 1},
    {unique: true}
)

librarySchema.index(
    {userId: 1, status: 1},
);

export const Library = mongoose.model<ILibrary>("Library", librarySchema);