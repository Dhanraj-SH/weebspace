import { createLibraryEntry, deleteLibraryEntry, findLibraryByUserId, updateLibraryEntry } from "../repositories/libraryRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateLibraryData, LibraryQuery, UpdateLibraryData } from "../validators/libraryValidators.js";

export const getLibrary = async (userId: string, query: LibraryQuery) => {
    return await findLibraryByUserId(userId, query);
};

export const addToLibrary = async (userId: string, libraryData: CreateLibraryData) => {
    if (!(await findMangaById(libraryData.mangaId))) {
        throw new AppError("Manga not found", 404);
    }

    try {
        return await createLibraryEntry(userId, libraryData);
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            throw new AppError("Manga already exists in your library", 409);
        }

        throw error;
    }
};

export const updateLibraryStatus = async (userId: string, mangaId: string, libraryData: UpdateLibraryData) => {
    const entry = await updateLibraryEntry(userId, mangaId, libraryData);

    if (!entry) {
        throw new AppError("Manga is not in your library", 404);
    }

    return entry;
};

export const removeFromLibrary = async (userId: string, mangaId: string) => {
    const entry = await deleteLibraryEntry(userId, mangaId);

    if (!entry) {
        throw new AppError("Manga is not in your library", 404);
    }

    return entry;
};
