import { ReadingProgress, type IReadingProgress } from "../models/readingProgressModel.js";
import { buildPaginationMeta, getSkip, type PaginationInput } from "../utils/pagination.js";

export interface SaveProgressInput {
    chapterId: string;
    pageNumber: number;
    completed: boolean;
}

export const findReadingProgress = async (userId: string, mangaId: string): Promise<IReadingProgress | null> => {
    return await ReadingProgress.findOne({ userId, mangaId });
};

/** Most recently read manga first — powers "Continue reading". */
export const findRecentReadingProgress = async (userId: string, pagination: PaginationInput) => {
    const [progress, total] = await Promise.all([
        ReadingProgress.find({ userId })
            .populate({ path: "mangaId", select: "title coverImage" })
            .populate({ path: "chapterId", select: "chapterNumber title" })
            .sort({ updatedAt: -1 })
            .skip(getSkip(pagination))
            .limit(pagination.limit),
        ReadingProgress.countDocuments({ userId }),
    ]);

    return { progress, meta: buildPaginationMeta(pagination, total) };
};

export const upsertReadingProgress = async (userId: string, mangaId: string, progressData: SaveProgressInput): Promise<IReadingProgress | null> => {
    return await ReadingProgress.findOneAndUpdate(
        { userId, mangaId },
        { $set: progressData },
        { returnDocument: "after", runValidators: true, upsert: true }
    );
};

export const deleteReadingProgress = async (userId: string, mangaId: string): Promise<IReadingProgress | null> => {
    return await ReadingProgress.findOneAndDelete({ userId, mangaId });
};

export const deleteManyReadingProgressByMangaId = async (mangaId: string) => {
    return await ReadingProgress.deleteMany({ mangaId });
};

export const deleteManyReadingProgressByChapterId = async (chapterId: string) => {
    return await ReadingProgress.deleteMany({ chapterId });
};
