import { toChapterDto } from "../dtos/mediaDto.js";
import { createChapter, deleteChapter, getChapterById, getChaptersByMangaId, updateChapter } from "../services/chapterService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { chapterIdSchema, createChapterSchema, updateChapterSchema } from "../validators/chapterValidator.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";

export const getChaptersByManga = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, (await getChaptersByMangaId(mangaId)).map(toChapterDto));
});

export const getChapter = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);

    sendSuccess(res, 200, toChapterDto(await getChapterById(chapterId)));
});

export const createChapterController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const chapter = await createChapter(mangaId, createChapterSchema.parse(req.body));

    sendSuccess(res, 201, toChapterDto(chapter), { message: "Chapter created" });
});

export const updateChapterController = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);
    const chapter = await updateChapter(chapterId, updateChapterSchema.parse(req.body));

    sendSuccess(res, 200, toChapterDto(chapter), { message: "Chapter updated" });
});

export const deleteChapterController = asyncHandler(async (req, res) => {
    const { chapterId } = chapterIdSchema.parse(req.params);

    sendSuccess(res, 200, toChapterDto(await deleteChapter(chapterId)), { message: "Chapter deleted" });
});
