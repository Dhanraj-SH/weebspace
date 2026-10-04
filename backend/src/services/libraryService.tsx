import { createLibraryEntry, deleteLibraryEntry, findLibraryByUserId, updateLibraryEntry } from "../repositories/libraryRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateLibraryData, UpdateLibraryData } from "../validators/libraryValidators.js";

export const getLibraryByUserId = async(userId: string) => {
    return await findLibraryByUserId(userId);
};

export const createLibrary = async(userId: string, libraryData: CreateLibraryData) => {
    try{
        return await createLibraryEntry(userId, libraryData);
    } catch(error: any){
        if(error.code === 11000){
            throw new AppError("Manga already exists in the library", 409);
        }

        throw error;
    }
};

export const updateLibraryById = async(userId: string, mangaId: string, libraryData: UpdateLibraryData) => {
    return await updateLibraryEntry(userId, mangaId, libraryData);
}

export const deleteLibraryById = async(userId: string, mangaId: string) => {
    return await deleteLibraryEntry(userId, mangaId);
};