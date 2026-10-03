import { Manga, type IManga } from "../models/mangaModel.js";
import type { UpdateMangaData } from "../validators/mangaValidators.js";

export const findAllManga = async(): Promise<IManga[]> => {
    return Manga.find();
};

export const findMangaById = async(mangaId: string): Promise<IManga | null> => {
    return Manga.findById(mangaId);
};

export const createManga = async(mangaData: Partial<IManga>): Promise<IManga> => {
    return Manga.create(mangaData);
};

export const updateMangeById = async(mangaId: string, mangaData: UpdateMangaData): Promise<IManga | null> => {
    const cleanedData = Object.fromEntries(Object.entries(mangaData).filter(([, value]) => value !== undefined));

    return Manga.findByIdAndUpdate(
        mangaId,
        cleanedData,
        {
            returnDocument: after,
            runValidators: true,
        }
    );
};

export const deleteMangaById = async(mangaId: string): Promise<IManga | null> => {
    return Manga.findByIdAndDelete(mangaId);
}