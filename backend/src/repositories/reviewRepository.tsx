import { Review, type IReview } from "../models/reviewModel.js";
import type { CreateReviewData, UpdateReviewData } from "../validators/reviewValidators.js";

export const createReviewById = async(userId: string, mangaId: string, reviewData: CreateReviewData): Promise<IReview> => {
    return await Review.create({userId, mangaId, ...reviewData});
};

export const getReviewByMangaId = async(mangaId: string): Promise<IReview[] | null> => {
    return await Review.find({ mangaId }).sort({ createdAt: -1 });
};

export const getReviewById = async(reviewId: string): Promise<IReview | null> => {
    return await Review.findById(reviewId);
};

export const updateReviewById = async(userId: string, reviewId: string, reviewData: UpdateReviewData): Promise<IReview | null> => {
    return await Review.findOneAndUpdate(
        {
            _id: reviewId,
            userId
        },{
            $set: reviewData
        },{
            returnDocument: "after",
            runValidators: true
        }
    );
};

export const deleteReviewById = async(userId: string, reviewId: string): Promise<IReview | null> => {
    return await Review.findOneAndDelete({
        _id: reviewId,
        userId
    });
};

export const deleteReviewByMangaId = async(mangaId: string) => {
    return await Review.findOneAndDelete({
        mangaId
    });
};