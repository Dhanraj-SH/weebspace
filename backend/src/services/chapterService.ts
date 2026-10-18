import { findChapterById, findChaptersByMangaId, createChapter as createChapterRepository, updateChapterById, deleteChapterById, findAdjacentChapterIds } from "../repositories/chapterRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { deleteManyReadingProgressByChapterId } from "../repositories/readingProgressRepository.js";
import { deleteManyCommentsByChapterId } from "../repositories/commentRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateChapterData, UpdateChapterData } from "../validators/chapterValidator.js";
import { removeStoredFiles, verifyStoredFiles } from "./mediaService.js";
import { chapterPrefix } from "../utils/storageKeys.js";

const CHAPTER_NUMBER_EXISTS = "Chapter number already exists in this manga";

const isDuplicateKeyError = (error: unknown): boolean => (error as { code?: number }).code === 11000;

export const getChaptersByMangaId = async (mangaId: string) => {
    if (!(await findMangaById(mangaId))) {
        throw new AppError("Manga not found", 404);
    }

    return await findChaptersByMangaId(mangaId);
};

export const getChapterById = async (chapterId: string) => {
    const chapter = await findChapterById(chapterId);

    if (!chapter) {
        throw new AppError("Chapter not found", 404);
    }

    const adjacent = await findAdjacentChapterIds(chapter.mangaId.toString(), chapter.chapterNumber);

    return { ...chapter.toObject(), ...adjacent };
};

export const createChapter = async (mangaId: string, chapterData: CreateChapterData) => {
    if (!(await findMangaById(mangaId))) {
        throw new AppError("Manga not found", 404);
    }

    try {
        return await createChapterRepository(mangaId, chapterData);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(CHAPTER_NUMBER_EXISTS, 409);
        }

        throw error;
    }
};

export const updateChapter = async (chapterId: string, chapterData: UpdateChapterData) => {
    if(chapterData.pages !== undefined) {
        const existing = await findChapterById(chapterId);

        if(!existing){
            throw new AppError("Chapter not found", 404);
        }

        await verifyStoredFiles(chapterData.pages, chapterPrefix(existing.mangaId.toString(), chapterId));
    }
    
    try {
        const chapter = await updateChapterById(chapterId, chapterData);

        if (!chapter) {
            throw new AppError("Chapter not found", 404);
        }

        return chapter;
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(CHAPTER_NUMBER_EXISTS, 409);
        }

        throw error;
    }
};

export const deleteChapter = async (chapterId: string) => {
    const chapter = await deleteChapterById(chapterId);

    if (!chapter) {
        throw new AppError("Chapter not found", 404);
    }

    await deleteManyReadingProgressByChapterId(chapterId);
    await deleteManyCommentsByChapterId(chapterId);

    await removeStoredFiles(chapterPrefix(chapter.mangaId.toString(), chapterId));

    return chapter;
};