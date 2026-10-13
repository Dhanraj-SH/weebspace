import { Review, type IReview } from "../models/reviewModel.js";
import { ReviewLike } from "../models/reviewLikeModel.js";
import { buildPaginationMeta, getSkip, type PaginationInput } from "../utils/pagination.js";

export const findReviewById = async (reviewId: string): Promise<IReview | null> => {
    return await Review.findById(reviewId);
};

export const findReviewsByMangaId = async (mangaId: string, pagination: PaginationInput) => {
    const [reviews, total] = await Promise.all([
        Review.find({ mangaId })
            .sort({ createdAt: -1 })
            .skip(getSkip(pagination))
            .limit(pagination.limit)
            .lean(),
        Review.countDocuments({ mangaId }),
    ]);

    return { reviews, meta: buildPaginationMeta(pagination, total) };
};

export const createReview = async (userId: string, mangaId: string, content: string): Promise<IReview> => {
    return await Review.create({ userId, mangaId, content });
};

export const updateReviewContent = async (reviewId: string, content: string): Promise<IReview | null> => {
    return await Review.findByIdAndUpdate(reviewId, { $set: { content } }, { returnDocument: "after", runValidators: true });
};

export const deleteReviewById = async (reviewId: string): Promise<IReview | null> => {
    const review = await Review.findByIdAndDelete(reviewId);

    if (review) {
        await ReviewLike.deleteMany({ reviewId });
    }

    return review;
};

export const deleteManyReviewsByMangaId = async (mangaId: string) => {
    const reviews = await Review.find({ mangaId }).select("_id").lean();

    await ReviewLike.deleteMany({ reviewId: { $in: reviews.map((review) => review._id) } });

    return await Review.deleteMany({ mangaId });
};

export const addReviewLike = async (userId: string, reviewId: string): Promise<boolean> => {
    try {
        await ReviewLike.create({ userId, reviewId });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            return false;
        }

        throw error;
    }

    await Review.updateOne({ _id: reviewId }, { $inc: { likesCount: 1 } });
    return true;
};

export const removeReviewLike = async (userId: string, reviewId: string): Promise<boolean> => {
    const result = await ReviewLike.deleteOne({ userId, reviewId });

    if (result.deletedCount === 0) {
        return false;
    }

    await Review.updateOne({ _id: reviewId }, { $inc: { likesCount: -1 } });
    return true;
};
