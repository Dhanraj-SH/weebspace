import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createChapterCommentService, createMangaCommentService, deleteCommentService, getChapterCommentsService, getMangaCommentsService, updateCommentService } from "../services/commentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { chapterIdSchema } from "../validators/chapterValidator.js";
import { commentIdSchema, commentListQuerySchema, createCommentSchema, updateCommentSchema } from "../validators/commentValidators.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";

export const getMangaComments = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const { comments, meta } = await getMangaCommentsService(mangaId, commentListQuerySchema.parse(req.query));

    sendSuccess(res, 200, comments, { meta });
});

export const createMangaComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const comment = await createMangaCommentService(requireUserId(req), mangaId, createCommentSchema.parse(req.body));

    sendSuccess(res, 201, comment, { message: "Comment created" });
});

export const getChapterComments = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);
    const { comments, meta } = await getChapterCommentsService(chapterId, commentListQuerySchema.parse(req.query));

    sendSuccess(res, 200, comments, { meta });
});

export const createChapterComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);
    const comment = await createChapterCommentService(requireUserId(req), chapterId, createCommentSchema.parse(req.body));

    sendSuccess(res, 201, comment, { message: "Comment created" });
});

export const updateComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { commentId } = commentIdSchema.parse(req.params);
    const comment = await updateCommentService(requireUserId(req), commentId, updateCommentSchema.parse(req.body));

    sendSuccess(res, 200, comment, { message: "Comment updated" });
});

export const deleteComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { commentId } = commentIdSchema.parse(req.params);

    sendSuccess(res, 200, await deleteCommentService(requireUserId(req), commentId), { message: "Comment deleted" });
});
