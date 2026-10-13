import { deleteReadingProgress, findReadingProgress, findRecentReadingProgress, upsertReadingProgress } from "../repositories/readingProgressRepository.js";
import { findChapterById } from "../repositories/chapterRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import type { PaginationInput } from "../utils/pagination.js";
import type { UpdateProgressData } from "../validators/readingProgressValidators.js";

const ensureMangaExists = async (mangaId: string): Promise<void> => {
    if (!(await findMangaById(mangaId))) {
        throw new AppError("Manga not found", 404);
    }
};

/** Returns null when the user has not started this manga yet. */
export const getReadingProgress = async (userId: string, mangaId: string) => {
    await ensureMangaExists(mangaId);

    return await findReadingProgress(userId, mangaId);
};

export const getRecentReadingProgress = async (userId: string, pagination: PaginationInput) => {
    return await findRecentReadingProgress(userId, pagination);
};

export const saveReadingProgress = async (userId: string, mangaId: string, progressData: UpdateProgressData) => {
    await ensureMangaExists(mangaId);

    const chapter = await findChapterById(progressData.chapterId);

    if (!chapter) {
        throw new AppError("Chapter not found", 404);
    }

    if (chapter.mangaId.toString() !== mangaId) {
        throw new AppError("Chapter does not belong to this manga", 400);
    }

    const totalPages = chapter.pages.length;

    if (totalPages > 0 && progressData.pageNumber > totalPages) {
        throw new AppError(`Page number must be between 1 and ${totalPages}`, 400);
    }

    const progress = await upsertReadingProgress(userId, mangaId, {
        chapterId: progressData.chapterId,
        pageNumber: progressData.pageNumber,
        completed: totalPages > 0 && progressData.pageNumber === totalPages,
    });

    if (!progress) {
        throw new AppError("Could not save reading progress", 500);
    }

    return progress;
};

export const removeReadingProgress = async (userId: string, mangaId: string) => {
    const progress = await deleteReadingProgress(userId, mangaId);

    if (!progress) {
        throw new AppError("Reading progress not found", 404);
    }

    return progress;
};
