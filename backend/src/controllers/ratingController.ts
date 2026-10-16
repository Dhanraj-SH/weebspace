import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getMyRating as getMyRatingService, getRatingSummary as getRatingSummaryService, removeMyRating as removeMyRatingService, saveMyRating } from "../services/ratingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { saveRatingSchema } from "../validators/ratingValidators.js";

export const getRatingSummary = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await getRatingSummaryService(mangaId));
});

export const getMyRating = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await getMyRatingService(requireUserId(req), mangaId));
});

export const saveRating = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const { value } = saveRatingSchema.parse(req.body);

    sendSuccess(res, 200, await saveMyRating(requireUserId(req), mangaId, value), { message: "Rating saved" });
});

export const removeRating = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await removeMyRatingService(requireUserId(req), mangaId), { message: "Rating removed" });
});
