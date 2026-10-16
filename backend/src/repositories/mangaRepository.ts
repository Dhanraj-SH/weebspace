import { Manga, type IManga } from "../models/mangaModel.js";
import type { CreateMangaData, ListMangaQuery, UpdateMangaData } from "../validators/mangaValidators.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { buildPaginationMeta, getSkip } from "../utils/pagination.js";

const removeUndefined = <T extends object>(data: T): Partial<T> =>
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

export const findMangaById = async (mangaId: string): Promise<IManga | null> => {
    return await Manga.findById(mangaId);
};

export const createManga = async (mangaData: CreateMangaData): Promise<IManga> => {
    const { coverImage, ...rest } = mangaData;

    return await Manga.create({
        ...rest,
        ...(coverImage !== undefined ? { coverImage } : {}),
    });
};

export const updateMangaById = async (mangaId: string, mangaData: UpdateMangaData): Promise<IManga | null> => {
    return await Manga.findByIdAndUpdate(mangaId, removeUndefined(mangaData), {
        returnDocument: "after",
        runValidators: true,
    });
};

export const deleteMangaById = async (mangaId: string): Promise<IManga | null> => {
    return await Manga.findByIdAndDelete(mangaId);
};

export const listManga = async (query: ListMangaQuery) => {
    const { q, genre, status, page, limit, sortBy, order } = query;
    const filter: Record<string, unknown> = {};

    if (q) {
        const escapedQuery = escapeRegex(q);

        filter.$or = [
            { title: { $regex: escapedQuery, $options: "i" } },
            { alternativeTitles: { $regex: escapedQuery, $options: "i" } },
            { authors: { $regex: escapedQuery, $options: "i" } },
            { artists: { $regex: escapedQuery, $options: "i" } },
        ];
    }

    if (genre) filter.genres = genre;
    if (status) filter.status = status;

    const sortOrder: 1 | -1 = order === "asc" ? 1 : -1;

    const [manga, total] = await Promise.all([
        Manga.find(filter)
            .sort({ [sortBy]: sortOrder, _id: sortOrder })
            .skip(getSkip({ page, limit }))
            .limit(limit)
            .lean(),
        Manga.countDocuments(filter),
    ]);

    return { manga, meta: buildPaginationMeta({ page, limit }, total) };
};
