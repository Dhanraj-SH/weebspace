import { findChapterById } from "../repositories/chapterRepository.js";
import { createCommentByChapterId, createCommentByMangaId, deleteCommentById, getCommentByChapterId, getCommentByMangaId, updateCommentById } from "../repositories/commentRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateCommentData, UpdateCommentData } from "../validators/commetValidators.js";

export const createCommentService = async(userId: string, mangaId: string, commentData: CreateCommentData) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

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