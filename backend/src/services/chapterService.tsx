import { findChapterById, findChapterByMangaId, createChapter as createChapterRepository, updateChapterById, deleteChapterById } from "../repositories/chapterRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateChapterData } from "../validators/chapterValidator.js";
import type { UpdateMangaData } from "../validators/mangaValidators.js";

export const getChaptersByMangaId = async(mangaId: string) => {
    return await findChapterByMangaId(mangaId);
};

export const getChapterById = async(chapterId: string) => {
    return await findChapterById(chapterId);
};

export const createChapter = async(mangaId: string, chapterData: CreateChapterData) => {
    try {
        return await createChapterRepository(mangaId, chapterData);
    } catch(error: any) {
        if(error.code === 11000){
            throw new AppError("Chapter number already exists in the manga", 409);
        }
    }
};

export const updateChapter = async(chapterId: string, chapterData: UpdateMangaData) => {
    try {
        return await updateChapterById(chapterId, chapterData);
    } catch(error: any) {
        if(error.code = 11000){
            throw new AppError("Chapter number already exists in the manga", 409);
        }
    }
};


export const deleteChapter = async(chapterId: string) => {
    return await deleteChapterById(chapterId);
};