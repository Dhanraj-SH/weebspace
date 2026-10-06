import { deleteReadingProgress, findReadingProgress, updateReadingProgress } from "../repositories/readingProgessRepository.js";
import type { UpdateProgressData } from "../validators/readingProgressValidators.js";
import { findChapterById } from "../repositories/chapterRepository.js";
import { AppError } from "../utils/appError.js";

export const getReadingProgessById = async(userId: string, mangaId: string) => {
    return await findReadingProgress(userId, mangaId);
};

export const saveReadingProgress = async(userId: string, mangaId: string, progressData: UpdateProgressData) => {
    const chapter = await findChapterById(progressData.chapterId);

    if(!chapter){
        throw new AppError("Chapter not found", 404);
    }

    if(chapter.mangaId.toString() !== mangaId){
        throw new AppError("Chapter does not belong to this manga", 400);
    }

    return await updateReadingProgress(userId, mangaId, progressData);
};

export const deleteReadingProgressById = async(userId: string, mangaId: string) => {
    return await deleteReadingProgress(userId, mangaId);
};