import { findLibraryByUserId } from "../repositories/libraryRepository.js";

export const getLibraryByUserId = async(userId: string) => {
    return await findLibraryByUserId(userId);
}