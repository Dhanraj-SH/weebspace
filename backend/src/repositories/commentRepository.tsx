import { Comment, type IComment } from "../models/commentModel.js";
import type { CreateCommentData, UpdateCommentData } from "../validators/commetValidators.js";

export const createCommentByMangaId = async(userId: string, mangaId: string, commentData: CreateCommentData): Promise<IComment | null> => {
    const { parentCommentId, ...commentFields } = commentData;

    return await Comment.create({
        userId,
        mangaId,
        ...commentFields,
        ...(parentCommentId ? { parentCommentId } : {})
    });
};

export const getCommentByMangaId = async(mangaId: string): Promise<IComment[] | null> => {
    return await Comment.find({mangaId}).sort({createdAt: -1});
};

export const createCommentByChapterId = async(userId: string, mangaId: string, chapterId: string, commentData: CreateCommentData): Promise<IComment | null> => {
    const { parentCommentId, ...commentFields } = commentData;

    return await Comment.create({
        userId,
        mangaId,
        chapterId,
        ...commentFields,
        ...(parentCommentId ? { parentCommentId } : {})
    });
};

export const getCommentByChapterId = async(chapterId: string): Promise<IComment[] | null> => {
    return await Comment.find({chapterId}).sort({createdAt: -1});
};

export const updateCommentById = async(userId: string, commentId: string, commentData: UpdateCommentData): Promise<IComment | null> => {
    return await Comment.findOneAndUpdate(
        {
            _id: commentId,
            userId
        },{
            $set: commentData
        },{
            returnDocument: "after",
            runValidators: true
        }
    );
};

export const deleteCommentById = async(userId: string, commentId: string): Promise<IComment | null> => {
    const comment = await Comment.findOne({
        _id: commentId,
        userId
    });

    if(!comment){
        return null;
    }

    const deleteChild = async (parentCommentId: string): Promise<void> => {
        const replies = await Comment.find({parentCommentId});
        
        for(const reply of replies) {
            await deleteChild(reply._id.toString());
        }

        await Comment.deleteMany({parentCommentId});
    };

    await deleteChild(commentId);
    await Comment.findByIdAndDelete(commentId);

    return comment;
};

export const deleteCommentByMangaId = async(mangaId: string) => {
    return await Comment.findOneAndDelete({
        mangaId
    });
};