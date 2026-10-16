import { createChapter, deleteChapter, getChapterById, getChaptersByMangaId, updateChapter } from "../services/chapterService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { chapterIdSchema, createChapterSchema, updateChapterSchema } from "../validators/chapterValidator.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";

export const getChaptersByManga = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await getChaptersByMangaId(mangaId));
});

export const getChapter = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);

    sendSuccess(res, 200, await getChapterById(chapterId));
});

export const createChapterController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const chapter = await createChapter(mangaId, createChapterSchema.parse(req.body));

    sendSuccess(res, 201, chapter, { message: "Chapter created" });
});

export const updateChapterController = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);
    const chapter = await updateChapter(chapterId, updateChapterSchema.parse(req.body));

    sendSuccess(res, 200, chapter, { message: "Chapter updated" });
});

export const deleteChapterController = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);

    sendSuccess(res, 200, await deleteChapter(chapterId), { message: "Chapter deleted" });
});
