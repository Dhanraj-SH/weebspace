import { findMangaById } from "../repositories/mangaRepository.js";
import { deleteRating, findRating, getRatingDistribution, syncMangaRatingStats, upsertRating } from "../repositories/ratingRepository.js";
import { AppError } from "../utils/appError.js";

const getExistingManga = async (mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if (!manga) {
        throw new AppError("Manga not found", 404);
    }

    return manga;
};

export const getRatingSummary = async (mangaId: string) => {
    const manga = await getExistingManga(mangaId);

    return {
        average: manga.ratingAverage,
        count: manga.ratingCount,
        distribution: await getRatingDistribution(mangaId),
    };
};

export const getMyRating = async (userId: string, mangaId: string) => {
    await getExistingManga(mangaId);

    const rating = await findRating(userId, mangaId);

    if (!rating) {
        throw new AppError("You have not rated this manga", 404);
    }

    return rating;
};

export const saveMyRating = async (userId: string, mangaId: string, value: number) => {
    await getExistingManga(mangaId);

    const rating = await upsertRating(userId, mangaId, value);

    if (!rating) {
        throw new AppError("Could not save rating", 500);
    }

    await syncMangaRatingStats(mangaId);

    return rating;
};

export const removeMyRating = async (userId: string, mangaId: string) => {
    await getExistingManga(mangaId);

    const rating = await deleteRating(userId, mangaId);

    if (!rating) {
        throw new AppError("You have not rated this manga", 404);
    }

    await syncMangaRatingStats(mangaId);

    return rating;
};
