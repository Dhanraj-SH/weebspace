import mongoose from "mongoose";
import { Comment, type IComment } from "../models/commentModel.js";
import type { CreateCommentData } from "../validators/commentValidators.js";
import { buildPaginationMeta, getSkip, type PaginationInput } from "../utils/pagination.js";

export const DELETED_COMMENT_TEXT = "[deleted]";

export const findCommentById = async (commentId: string): Promise<IComment | null> => {
    return await Comment.findById(commentId);
};

export const createComment = async (
    userId: string,
    mangaId: string,
    chapterId: string | undefined,
    commentData: CreateCommentData
): Promise<IComment> => {
    return await Comment.create({
        userId,
        mangaId,
        content: commentData.content,
        ...(chapterId ? { chapterId } : {}),
        ...(commentData.parentCommentId ? { parentCommentId: commentData.parentCommentId } : {}),
    });
};

type CommentScope = { mangaId: string } | { chapterId: string };

export const findThreadedComments = async (scope: CommentScope, pagination: PaginationInput) => {
    const filter = "chapterId" in scope
        ? { chapterId: scope.chapterId, parentCommentId: null }
        : { mangaId: scope.mangaId, chapterId: null, parentCommentId: null };

    const [topLevel, total] = await Promise.all([
        Comment.find(filter).sort({ createdAt: -1 }).skip(getSkip(pagination)).limit(pagination.limit).lean(),
        Comment.countDocuments(filter),
    ]);

    const replies = topLevel.length === 0
        ? []
        : await Comment.find({ parentCommentId: { $in: topLevel.map((comment) => comment._id) } })
            .sort({ createdAt: 1 })
            .lean();

    const comments = topLevel.map((comment) => ({
        ...comment,
        replies: replies.filter((reply) => reply.parentCommentId?.toString() === comment._id.toString()),
    }));

    return { comments, meta: buildPaginationMeta(pagination, total) };
};

export const countReplies = async (commentId: string): Promise<number> => {
    return await Comment.countDocuments({ parentCommentId: new mongoose.Types.ObjectId(commentId) });
};

export const updateCommentContent = async (commentId: string, content: string): Promise<IComment | null> => {
    return await Comment.findByIdAndUpdate(commentId, { $set: { content } }, { returnDocument: "after", runValidators: true });
};

export const hardDeleteComment = async (commentId: string): Promise<IComment | null> => {
    return await Comment.findByIdAndDelete(commentId);
};

export const softDeleteComment = async (commentId: string): Promise<IComment | null> => {
    return await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content: DELETED_COMMENT_TEXT, deletedAt: new Date() } },
        { returnDocument: "after" }
    );
};

export const deleteManyCommentsByMangaId = async (mangaId: string) => {
    return await Comment.deleteMany({ mangaId });
};

export const deleteManyCommentsByChapterId = async (chapterId: string) => {
    return await Comment.deleteMany({ chapterId });
};
