import { createManga as createMangaRepository, deleteMangaById, findMangaById, listManga as listMangaRepository, updateMangaById } from "../repositories/mangaRepository.js";
import { deleteManyChaptersByMangaId } from "../repositories/chapterRepository.js";
import { deleteManyLibraryEntriesByMangaId } from "../repositories/libraryRepository.js";
import { deleteManyRatingsByMangaId } from "../repositories/ratingRepository.js";
import { deleteManyReadingProgressByMangaId } from "../repositories/readingProgressRepository.js";
import { deleteManyReviewsByMangaId } from "../repositories/reviewRepository.js";
import { deleteManyCommentsByMangaId } from "../repositories/commentRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateMangaData, ListMangaQuery, UpdateMangaData } from "../validators/mangaValidators.js";
import { removeStoredFiles, verifyStoredFiles } from "./mediaService.js";
import { mangaPrefix } from "../utils/storageKeys.js";

export const listManga = async (query: ListMangaQuery) => {
    return await listMangaRepository(query);
};

export const getMangaById = async (mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }

    return manga;
};

export const createManga = async (mangaData: CreateMangaData) => {
    return await createMangaRepository(mangaData);
};

export const updateManga = async (mangaId: string, mangaData: UpdateMangaData) => {
    if (mangaData.coverImage !== undefined) {
        await getMangaById(mangaId);
        await verifyStoredFiles([mangaData.coverImage], `${mangaPrefix(mangaId)}cover/`);
    }

    const manga = await updateMangaById(mangaId, mangaData);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }

    return manga;
};

export const deleteManga = async (mangaId: string) => {
    await getMangaById(mangaId);

    await deleteManyCommentsByMangaId(mangaId);
    await deleteManyReviewsByMangaId(mangaId);
    await deleteManyRatingsByMangaId(mangaId);
    await deleteManyReadingProgressByMangaId(mangaId);
    await deleteManyLibraryEntriesByMangaId(mangaId);
    await deleteManyChaptersByMangaId(mangaId);

    const manga = await deleteMangaById(mangaId);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }

    await removeStoredFiles(mangaPrefix(mangaId));

    return manga;
};
