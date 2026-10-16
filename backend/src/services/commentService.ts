import { findChapterById } from "../repositories/chapterRepository.js";
import { createComment, deleteManyRepliesByParentId, findCommentById, findThreadedComments, hardDeleteComment, updateCommentContent } from "../repositories/commentRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import type { IComment } from "../models/commentModel.js";
import { AppError } from "../utils/appError.js";
import type { PaginationInput } from "../utils/pagination.js";
import type { CreateCommentData, UpdateCommentData } from "../validators/commentValidators.js";
import { hasModeratorRights } from "./permissionService.js";

const validateReplyParent = async (parentCommentId: string | undefined, mangaId: string, chapterId?: string): Promise<void> => {
    if (!parentCommentId) return;

    const parent = await findCommentById(parentCommentId);

    if (!parent) {
        throw new AppError("Parent comment not found", 404);
    }

    if (parent.mangaId.toString() !== mangaId) {
        throw new AppError("Parent comment belongs to a different manga", 400);
    }

    if ((parent.chapterId?.toString() ?? null) !== (chapterId ?? null)) {
        throw new AppError("Parent comment belongs to a different chapter", 400);
    }

    if (parent.parentCommentId) {
        throw new AppError("Replies can only be one level deep", 400);
    }

};

const getExistingManga = async (mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }

    return manga;
};

const getExistingChapter = async (chapterId: string) => {
    const chapter = await findChapterById(chapterId);

    if (!chapter) {
        throw new AppError("Chapter not found", 404);
    }

    return chapter;
};

const getExistingComment = async (commentId: string): Promise<IComment> => {
    const comment = await findCommentById(commentId);

    if (!comment) {
        throw new AppError("Comment not found", 404);
    }

    return comment;
};

export const createMangaCommentService = async (userId: string, mangaId: string, commentData: CreateCommentData) => {
    await getExistingManga(mangaId);
    await validateReplyParent(commentData.parentCommentId, mangaId);

    return await createComment(userId, mangaId, undefined, commentData);
};

export const createChapterCommentService = async (userId: string, chapterId: string, commentData: CreateCommentData) => {
    const chapter = await getExistingChapter(chapterId);
    const mangaId = chapter.mangaId.toString();

    await validateReplyParent(commentData.parentCommentId, mangaId, chapterId);

    return await createComment(userId, mangaId, chapterId, commentData);
};

export const getMangaCommentsService = async (mangaId: string, pagination: PaginationInput) => {
    await getExistingManga(mangaId);

    return await findThreadedComments({ mangaId }, pagination);
};

export const getChapterCommentsService = async (chapterId: string, pagination: PaginationInput) => {
    await getExistingChapter(chapterId);

    return await findThreadedComments({ chapterId }, pagination);
};

export const updateCommentService = async (userId: string, commentId: string, commentData: UpdateCommentData) => {
    const comment = await getExistingComment(commentId);

    if (comment.userId.toString() !== userId) {
        throw new AppError("You can only edit your own comment", 403);
    }

    const updated = await updateCommentContent(commentId, commentData.content);

    if (!updated) {
        throw new AppError("Comment not found", 404);
    }

    return updated;
};

export const deleteCommentService = async (userId: string, commentId: string) => {
    const comment = await getExistingComment(commentId);

    if (comment.userId.toString() !== userId && !(await hasModeratorRights(userId))) {
        throw new AppError("You are not allowed to delete this comment", 403);
    }

    await deleteManyRepliesByParentId(commentId);

    return await hardDeleteComment(commentId);
};