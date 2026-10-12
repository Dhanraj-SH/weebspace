import { Manga, type IManga } from "../models/mangaModel.js";
import type { SearchMangaQuery, UpdateMangaData } from "../validators/mangaValidators.js";

export const findAllManga = async(): Promise<IManga[]> => {
    return await Manga.find();
};

export const findMangaById = async(mangaId: string): Promise<IManga | null> => {
    return await Manga.findById(mangaId);
};

export const createManga = async(mangaData: Partial<IManga>): Promise<IManga> => {
    return await Manga.create(mangaData);
};

export const updateMangeById = async(mangaId: string, mangaData: UpdateMangaData): Promise<IManga | null> => {
    const cleanedData = Object.fromEntries(Object.entries(mangaData).filter(([, value]) => value !== undefined));

    return await Manga.findByIdAndUpdate(
        mangaId,
        cleanedData,
        {
            returnDocument: "after",
            runValidators: true,
        }
    );
};

export const deleteMangaById = async(mangaId: string): Promise<IManga | null> => {
    return await Manga.findByIdAndDelete(mangaId);
};

export const searchMangaByQuery = async(query: SearchMangaQuery) => {
    const { q, genre, status, page, limit, sortBy, order } = query;
    const filter: Record<string, unknown> = {};

    if(q) {
        filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { alternativeTitles: { $regex: q, $options: "i" } },
            { authors: { $regex: q, $options: "i" } },
            { artists: { $regex: q, $options: "i" } },
        ];
    }

    if(genre) {
        filter.genres = genre;
    }

    if(status) {
        filter.status = status;
    }

    const sortOrder: 1 | -1 = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const [manga, total] = await Promise.all([
        await Manga.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        Manga.countDocuments(filter)
    ]);
    
    return {
        manga,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1
        }
    };
};