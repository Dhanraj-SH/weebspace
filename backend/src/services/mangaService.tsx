import { deleteMangaById, findAllManga, findMangaById, updateMangeById, createManga as createMangaRepository } from "../repositories/mangaRepository.js";
import { deleteChapterByMangaId } from "../repositories/chapterRepository.js";
import { deleteLibraryEntryById } from "../repositories/libraryRepository.js";
import { deleteRatingByMangaId } from "../repositories/ratingRepository.js";
import { deleteReadingProgressById } from "../repositories/readingProgessRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateMangaData, UpdateMangaData } from "../validators/mangaValidators.js";
import { deleteReviewByMangaId } from "../repositories/reviewRepository.js";

export const getAllManga = async() => {
    return await findAllManga();
};

export const getMangaById = async(mangaId: string) => {
    return await findMangaById(mangaId);
}

export const createManga = async(mangaData: CreateMangaData) => {
    return await createMangaRepository(mangaData);
}

export const updateManga = async(mangaId: string, mangaData: UpdateMangaData) => {
    return await updateMangeById(mangaId, mangaData);
}

export const deleteManga = async (mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }
    
    await deleteChapterByMangaId(mangaId);
    await deleteLibraryEntryById(mangaId);
    await deleteReadingProgressById(mangaId);
    await deleteRatingByMangaId(mangaId);
    await deleteReviewByMangaId(mangaId);

    return await deleteMangaById(mangaId);
};