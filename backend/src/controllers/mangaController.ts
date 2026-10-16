import { createManga, deleteManga, getMangaById, listManga, updateManga } from "../services/mangaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { createMangaSchema, listMangaQuerySchema, mangaIdSchema, updateMangaSchema } from "../validators/mangaValidators.js";

export const getMangaList = asyncHandler(async (req, res) => {
    const { manga, meta } = await listManga(listMangaQuerySchema.parse(req.query));

    sendSuccess(res, 200, manga, { meta });
});

export const getMangaDetails = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await getMangaById(mangaId));
});

export const createMangaController = asyncHandler(async (req, res) => {
    const manga = await createManga(createMangaSchema.parse(req.body));

    sendSuccess(res, 201, manga, { message: "Manga created" });
});

export const updateMangaController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const manga = await updateManga(mangaId, updateMangaSchema.parse(req.body));

    sendSuccess(res, 200, manga, { message: "Manga updated" });
});

export const deleteMangaController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, await deleteManga(mangaId), { message: "Manga deleted" });
});
