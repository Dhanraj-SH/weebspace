import { toMangaDto } from "../dtos/mediaDto.js";
import { createManga, deleteManga, getMangaById, listManga, recordMangaView, updateManga } from "../services/mangaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { createMangaSchema, listMangaQuerySchema, mangaIdSchema, updateMangaSchema } from "../validators/mangaValidators.js";

export const getMangaList = asyncHandler(async (req, res) => {
    const { manga, meta } = await listManga(listMangaQuerySchema.parse(req.query));

    sendSuccess(res, 200, manga.map(toMangaDto), { meta });
});

export const getMangaDetails = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, toMangaDto(await getMangaById(mangaId)));
});

export const recordMangaViewController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, { viewCount: await recordMangaView(mangaId) });
});

export const createMangaController = asyncHandler(async (req, res) => {
    const manga = await createManga(createMangaSchema.parse(req.body));

    sendSuccess(res, 201, toMangaDto(manga), { message: "Manga created" });
});

export const updateMangaController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const manga = await updateManga(mangaId, updateMangaSchema.parse(req.body));

    sendSuccess(res, 200, toMangaDto(manga), { message: "Manga updated" });
});

export const deleteMangaController = asyncHandler(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);

    sendSuccess(res, 200, toMangaDto(await deleteManga(mangaId)), { message: "Manga deleted" });
});
