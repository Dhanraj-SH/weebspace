import { findChapterById, findChapterByMangaId, createChapter as createChapterRepository, updateChapterById, deleteChapterById } from "../repositories/chapterRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateChapterData, UpdateChapterData } from "../validators/chapterValidator.js";

export const getChaptersByMangaId = async(mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if (!manga) {
    throw new AppError("Manga not found", 404);
    }

    return await findChapterByMangaId(mangaId);
};

export const getChapterById = async(chapterId: string) => {
    return await findChapterById(chapterId);
};

export const createChapter = async(mangaId: string, chapterData: CreateChapterData) => {
    try {
        const manga = await findMangaById(mangaId);

        if(!manga){
            throw new AppError("Manga not found", 404);
        }

        return await createChapterRepository(mangaId, chapterData);
    } catch(error: any) {
        if(error.code === 11000){
            throw new AppError("Chapter number already exists in the manga", 409);
        }

        throw error;
    }
};

export const updateChapter = async(chapterId: string, chapterData: UpdateChapterData) => {
    try {
        return await updateChapterById(chapterId, chapterData);
    } catch(error: any) {
        if(error.code === 11000){
            throw new AppError("Chapter number already exists in the manga", 409);
        }

        throw error;
    }
};


export const deleteChapter = async(chapterId: string) => {
    return await deleteChapterById(chapterId);
};