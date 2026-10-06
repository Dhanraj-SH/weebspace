import { Chapter, type IChapter } from "../models/chapterModel.js";
import type { CreateChapterData, UpdateChapterData } from "../validators/chapterValidator.js";

export const findChapterByMangaId = async(mangaId: string): Promise<IChapter[]> => {
    return await Chapter.find({ mangaId }).sort({ chapterNumber: 1 });
};

export const findChapterById = async(chapterId: string): Promise<IChapter | null> => {
    return await Chapter.findById(chapterId);
};

export const createChapter = async(mangaId: string, chapterData: CreateChapterData): Promise<IChapter> => {
    return await Chapter.create({
        mangaId,
        chapterNumber: chapterData.chapterNumber,
        pages: chapterData.pages,
        ...(chapterData.title === undefined ? {} : { title: chapterData.title }),
        ...(chapterData.publishedAt === undefined ? {} : { publishedAt: chapterData.publishedAt }),
    });
}

export const updateChapterById = async(chapterId: string, chapterData: UpdateChapterData): Promise<IChapter | null> => {
    const cleanedData = Object.fromEntries(Object.entries(chapterData).filter(([, value]) => value !== undefined));

    return await Chapter.findByIdAndUpdate(
        chapterId, 
        cleanedData, {
            returnDocument: "after",
            runValidators: true
        }
    );
};

export const deleteChapterById = async(chapterId: string): Promise<IChapter | null> => {
    return await Chapter.findByIdAndDelete(chapterId);
};

export const deleteChapterByMangaId = async(mangaId: string) => {
    return await Chapter.deleteMany({mangaId});
};