import type mongoose from "mongoose";
import { findMangaById } from "../repositories/mangaRepository.js";
import { findRatingsByUsersForManga } from "../repositories/ratingRepository.js";
import { addReviewLike, createReview, deleteReviewById, findReviewById, findReviewsByMangaId, removeReviewLike, updateReviewContent } from "../repositories/reviewRepository.js";
import type { IReview } from "../models/reviewModel.js";
import { AppError } from "../utils/appError.js";
import type { PaginationInput } from "../utils/pagination.js";
import type { CreateReviewData, UpdateReviewData } from "../validators/reviewValidators.js";
import { hasModeratorRights } from "./permissionService.js";
import { saveMyRating } from "./ratingService.js";

/** Adds the author's star rating (from the Rating collection, the single source of truth) to each review. */
const attachRatings = async <T extends { userId: mongoose.Types.ObjectId }>(mangaId: string, reviews: T[]) => {
    if (reviews.length === 0) return [];

    const ratings = await findRatingsByUsersForManga(mangaId, reviews.map((review) => review.userId.toString()));
    const ratingByUser = new Map(ratings.map((rating) => [rating.userId.toString(), rating.value]));

    return reviews.map((review) => ({ ...review, rating: ratingByUser.get(review.userId.toString()) ?? null }));
};

const withRating = async (review: IReview) => {
    const [result] = await attachRatings(review.mangaId.toString(), [review.toObject()]);

    return result!;
};

const getExistingReview = async (reviewId: string): Promise<IReview> => {
    const review = await findReviewById(reviewId);

    if (!review) {
        throw new AppError("Review not found", 404);
    }

    return review;
};

const assertOwnerOrModerator = async (userId: string, review: IReview): Promise<void> => {
    if (review.userId.toString() === userId) return;

    if (!(await hasModeratorRights(userId))) {
        throw new AppError("You are not allowed to modify this review", 403);
    }
};

export const createReviewService = async (userId: string, mangaId: string, reviewData: CreateReviewData) => {
    if (!(await findMangaById(mangaId))) {
        throw new AppError("Manga not found", 404);
    }

    let review: IReview;

    try {
        review = await createReview(userId, mangaId, reviewData.content);
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            throw new AppError("You have already reviewed this manga", 409);
        }

        throw error;
    }

    if (reviewData.rating !== undefined) {
        await saveMyRating(userId, mangaId, reviewData.rating);
    }

    return await withRating(review);
};

export const getReviewsByMangaService = async (mangaId: string, pagination: PaginationInput) => {
    if (!(await findMangaById(mangaId))) {
        throw new AppError("Manga not found", 404);
    }

    const { reviews, meta } = await findReviewsByMangaId(mangaId, pagination);

    return { reviews: await attachRatings(mangaId, reviews), meta };
};

export const getReviewService = async (reviewId: string) => {
    return await withRating(await getExistingReview(reviewId));
};

export const updateReviewService = async (userId: string, reviewId: string, reviewData: UpdateReviewData) => {
    const review = await getExistingReview(reviewId);

    // Only the author can edit the text of a review
    if (review.userId.toString() !== userId) {
        throw new AppError("You can only edit your own review", 403);
    }

    if (reviewData.rating !== undefined) {
        await saveMyRating(userId, review.mangaId.toString(), reviewData.rating);
    }

    const updated = reviewData.content !== undefined
        ? await updateReviewContent(reviewId, reviewData.content)
        : review;

    if (!updated) {
        throw new AppError("Review not found", 404);
    }

    return await withRating(updated);
};

export const deleteReviewService = async (userId: string, reviewId: string) => {
    const review = await getExistingReview(reviewId);

    await assertOwnerOrModerator(userId, review);

    const deleted = await deleteReviewById(reviewId);

    if (!deleted) {
        throw new AppError("Review not found", 404);
    }

    return deleted;
};

export const likeReviewService = async (userId: string, reviewId: string) => {
    await getExistingReview(reviewId);

    if (!(await addReviewLike(userId, reviewId))) {
        throw new AppError("You already liked this review", 409);
    }

    return await withRating(await getExistingReview(reviewId));
};

export const unlikeReviewService = async (userId: string, reviewId: string) => {
    await getExistingReview(reviewId);

    if (!(await removeReviewLike(userId, reviewId))) {
        throw new AppError("You have not liked this review", 409);
    }

    return await withRating(await getExistingReview(reviewId));
};
