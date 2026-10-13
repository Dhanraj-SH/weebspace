import { Library, type ILibrary } from "../models/libraryModel.js";
import type { CreateLibraryData, LibraryQuery, UpdateLibraryData } from "../validators/libraryValidators.js";
import { buildPaginationMeta, getSkip } from "../utils/pagination.js";

export const findLibraryByUserId = async (userId: string, query: LibraryQuery) => {
    const filter: Record<string, unknown> = { userId };

    if (query.status !== undefined) {
        filter.status = query.status;
    }

    const [library, total] = await Promise.all([
        Library.find(filter)
            .populate({ path: "mangaId", select: "title coverImage status ratingAverage" })
            .sort({ updatedAt: -1 })
            .skip(getSkip(query))
            .limit(query.limit),
        Library.countDocuments(filter),
    ]);

    return { library, meta: buildPaginationMeta(query, total) };
};

export const createLibraryEntry = async (userId: string, libraryData: CreateLibraryData): Promise<ILibrary> => {
    return await Library.create({ userId, ...libraryData });
};

export const updateLibraryEntry = async (userId: string, mangaId: string, libraryData: UpdateLibraryData): Promise<ILibrary | null> => {
    return await Library.findOneAndUpdate(
        { userId, mangaId },
        { $set: libraryData },
        { returnDocument: "after", runValidators: true }
    );
};

export const deleteLibraryEntry = async (userId: string, mangaId: string): Promise<ILibrary | null> => {
    return await Library.findOneAndDelete({ userId, mangaId });
};

export const deleteManyLibraryEntriesByMangaId = async (mangaId: string) => {
    return await Library.deleteMany({ mangaId });
};
