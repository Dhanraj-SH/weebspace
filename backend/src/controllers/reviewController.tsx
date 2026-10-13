import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createReviewService, deleteReviewService, getReviewService, getReviewsByMangaService, likeReviewService, unlikeReviewService, updateReviewService } from "../services/reviewService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { createReviewSchema, reviewIdSchema, reviewListQuerySchema, updateReviewSchema } from "../validators/reviewValidators.js";

export const getReviewsByManga = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const { reviews, meta } = await getReviewsByMangaService(mangaId, reviewListQuerySchema.parse(req.query));

    sendSuccess(res, 200, reviews, { meta });
});

export const getReview = asyncHandler(async (req, res) => {
    const { reviewId } = reviewIdSchema.parse(req.params);

    sendSuccess(res, 200, await getReviewService(reviewId));
});

export const createReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const review = await createReviewService(requireUserId(req), mangaId, createReviewSchema.parse(req.body));

    sendSuccess(res, 201, review, { message: "Review created" });
});

export const updateReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = reviewIdSchema.parse(req.params);
    const review = await updateReviewService(requireUserId(req), reviewId, updateReviewSchema.parse(req.body));

    sendSuccess(res, 200, review, { message: "Review updated" });
});

export const deleteReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = reviewIdSchema.parse(req.params);

    sendSuccess(res, 200, await deleteReviewService(requireUserId(req), reviewId), { message: "Review deleted" });
});

export const likeReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = reviewIdSchema.parse(req.params);

    sendSuccess(res, 200, await likeReviewService(requireUserId(req), reviewId), { message: "Review liked" });
});

export const unlikeReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = reviewIdSchema.parse(req.params);

    sendSuccess(res, 200, await unlikeReviewService(requireUserId(req), reviewId), { message: "Review unliked" });
});
