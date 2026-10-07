import { findMangaById } from "../repositories/mangaRepository.js";
import { createReviewById, deleteReviewById, getReviewById, getReviewByMangaId, updateReviewById } from "../repositories/reviewRepository.js";
import { AppError } from "../utils/appError.js";
import type { CreateReviewData, UpdateReviewData } from "../validators/reviewValidators.js";

export const createReviewService = async (userId: string, mangaId: string, reviewData: CreateReviewData) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }
    
    return await createReviewById(userId, mangaId, reviewData);
};

export const fetchByMangaId = async (mangaId: string) => {
    const manga = await findMangaById(mangaId);

    if(!manga){
        throw new AppError("Manga not found", 404);
    }

    return await getReviewByMangaId(mangaId);
};

export const fetchByReviewId = async (reviewId: string) => {
    return await getReviewById(reviewId);
};

export const updateReviewService = async(userId: string, reviewId: string, reviewData: UpdateReviewData) => {
    return await updateReviewById(userId, reviewId, reviewData);
};

export const deleteReviewService = async(userId: string, reviewId: string) => {
    return await deleteReviewById(userId, reviewId);
};