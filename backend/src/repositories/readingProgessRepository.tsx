import { Chapter, type IChapter } from "../models/chapterModel.js";
import { ReadingProgress, type IReadingProgress } from "../models/readingProgressModel.js";
import type { UpdateProgressData } from "../validators/readingProgressValidators.js";

export const findReadingProgress = async(userId: string, mangaId: string): Promise<IReadingProgress | null> => {
    return await ReadingProgress.findOne({
        userId,
        mangaId
    });
};

export const updateReadingProgress = async(userId: string, mangaId: string, progressData: UpdateProgressData): Promise<IReadingProgress | null> => {
    return await ReadingProgress.findOneAndUpdate(
        {
            userId,
            mangaId
        },{
            $set: {
                ...progressData,
                lastReadAt: new Date() 
            },
        },{
            returnDocument: "after",
            runValidators: true,
            upsert: true
        }
    );
};

export const deleteReadingProgress = async(userId: string, mangaId: string): Promise<IChapter | null> => {
    return await ReadingProgress.findOneAndDelete({userId, mangaId});
};