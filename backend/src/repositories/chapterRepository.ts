import { Chapter, type IChapter } from "../models/chapterModel.js";
import type { CreateChapterData, UpdateChapterData } from "../validators/chapterValidator.js";

export const findChaptersByMangaId = async (mangaId: string): Promise<IChapter[]> => {
    return await Chapter.find({ mangaId }).select("-pages").sort({ chapterNumber: 1 });
};

export const findChapterById = async (chapterId: string): Promise<IChapter | null> => {
    return await Chapter.findById(chapterId);
};

export const incrementChapterViewCount = async (chapterId: string) => {
    return await Chapter.findByIdAndUpdate(chapterId, { $inc: { viewCount: 1 } }, { returnDocument: "after" })
        .select("viewCount")
        .lean();
};

export const findAdjacentChapterIds = async (mangaId: string, chapterNumber: number) => {
    const [previous, next] = await Promise.all([
        Chapter.findOne({ mangaId, chapterNumber: { $lt: chapterNumber } }).sort({ chapterNumber: -1 }).select("_id"),
        Chapter.findOne({ mangaId, chapterNumber: { $gt: chapterNumber } }).sort({ chapterNumber: 1 }).select("_id"),
    ]);

    return {
        prevChapterId: previous?._id.toString() ?? null,
        nextChapterId: next?._id.toString() ?? null,
    };
};

export const createChapter = async (mangaId: string, chapterData: CreateChapterData): Promise<IChapter> => {
    return await Chapter.create({
        mangaId,
        chapterNumber: chapterData.chapterNumber,
        pages: chapterData.pages,
        ...(chapterData.title === undefined ? {} : { title: chapterData.title }),
        ...(chapterData.publishedAt === undefined ? {} : { publishedAt: chapterData.publishedAt }),
    });
};

export const updateChapterById = async (chapterId: string, chapterData: UpdateChapterData): Promise<IChapter | null> => {
    const cleanedData = Object.fromEntries(Object.entries(chapterData).filter(([, value]) => value !== undefined));

    return await Chapter.findByIdAndUpdate(chapterId, cleanedData, {
        returnDocument: "after",
        runValidators: true,
    });
};

export const deleteChapterById = async (chapterId: string): Promise<IChapter | null> => {
    return await Chapter.findByIdAndDelete(chapterId);
};

export const deleteManyChaptersByMangaId = async (mangaId: string) => {
    return await Chapter.deleteMany({ mangaId });
};
