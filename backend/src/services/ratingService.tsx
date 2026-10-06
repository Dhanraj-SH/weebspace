import { findMangaById } from "../repositories/mangaRepository.js";
import { deleteRatingById, findRatingById, upsertRatingById } from "../repositories/ratingRepository.js"
import { AppError } from "../utils/appError.js";
import type { UpdateRatingData } from "../validators/ratingValidators.js";

export const getRatingService = async(userId: string, mangaId: string) => {
    return await findRatingById(userId, mangaId);
};

export const saveRatingService = async(userId: string, mangaId: string, ratingData: UpdateRatingData) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

    return await upsertRatingById(userId, mangaId, ratingData);
};

export const removeRatingService = async(userId: string, mangaId: string) => {
    return await deleteRatingById(userId, mangaId);
}