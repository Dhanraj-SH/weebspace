import { deleteMangaById, findAllManga, findMangaById, updateMangeById, } from "../repositories/mangaRepository.js";
import { createManga as createMangaRepository } from "../repositories/mangaRepository.js";
import type { CreateMangaData, UpdateMangaData } from "../validators/mangaValidators.js";

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

export const deleteManga = async(mangaId: string) => {
    return await deleteMangaById(mangaId);
}