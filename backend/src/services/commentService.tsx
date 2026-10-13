import { findChapterById } from "../repositories/chapterRepository.js";
import { createCommentByChapterId, createCommentByMangaId, deleteCommentById, findCommentById, getCommentByChapterId, getCommentByMangaId, updateCommentById } from "../repositories/commentRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateCommentData, UpdateCommentData } from "../validators/commetValidators.js";

const validateReplyParent = async(parentCommentId: string | undefined,mangaId: string, chapterId?: string) => {

    if (!parentCommentId) return;

    const parent = await findCommentById(parentCommentId);

    if (!parent) {
        throw new AppError("Parent comment not found", 404);
    }

    if (parent.mangaId.toString() !== mangaId) {
        throw new AppError("Parent comment belongs to a different manga", 400);
    }

    const parentChapterId = parent.chapterId?.toString() ?? null;
    const replyChapterId = chapterId ?? null;

    if (parentChapterId !== replyChapterId) {
        throw new AppError("Parent comment belongs to a different chapter", 400);
    }

    if (parent.parentCommentId) {
        throw new AppError("Replies can only be one level deep", 400);
    }
};

export const createCommentService = async(userId: string, mangaId: string, commentData: CreateCommentData) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

    await validateReplyParent( commentData.parentCommentId, mangaId );

    return await createCommentByMangaId(userId, mangaId, commentData);
};

export const getCommentByMangaService = async(mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

    return await getCommentByMangaId(mangaId);
};

export const createCommentByChapterService = async(userId: string, chapterId: string, commentData: CreateCommentData) => {
    const chapter = await findChapterById(chapterId);

    if(!chapter){
        throw new AppError("Chapter not found", 404);
    }

    const mangaId = chapter.mangaId.toString();

    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

    await validateReplyParent( commentData.parentCommentId, mangaId, chapterId );

    return await createCommentByChapterId(userId, mangaId, chapterId, commentData);
};



export const getCommentByChapterService = async(chapterId: string) => {
    return await getCommentByChapterId(chapterId);
};

export const updateCommentService = async(userId: string, commentId: string, commentData: UpdateCommentData) => {
    return await updateCommentById(userId, commentId, commentData);
};

export const deleteCommentService = async(userId: string, commentId: string) => {
    return await deleteCommentById(userId, commentId);
}