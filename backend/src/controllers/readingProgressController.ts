import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getReadingProgress as getProgressService, getRecentReadingProgress, removeReadingProgress, saveReadingProgress } from "../services/readingProgressService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { progressListQuerySchema, updateReadingProgressSchema } from "../validators/readingProgressValidators.js";

export const listReadingProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { progress, meta } = await getRecentReadingProgress(requireUserId(req), progressListQuerySchema.parse(req.query));

    sendSuccess(res, 200, progress, { meta });
});

export const getReadingProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await getProgressService(requireUserId(req), mangaId));
});

export const saveProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const progress = await saveReadingProgress(requireUserId(req), mangaId, updateReadingProgressSchema.parse(req.body));

    sendSuccess(res, 200, progress);
});

export const deleteProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const progress = await removeReadingProgress(requireUserId(req), mangaId);

    sendSuccess(res, 200, progress, { message: "Progress deleted" });
});
