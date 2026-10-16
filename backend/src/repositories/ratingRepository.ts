import mongoose from "mongoose";
import { Manga } from "../models/mangaModel.js";
import { Rating, type IRating } from "../models/ratingModel.js";

export const findRating = async (userId: string, mangaId: string): Promise<IRating | null> => {
    return await Rating.findOne({ userId, mangaId });
};

export const findRatingsByUsersForManga = async (mangaId: string, userIds: string[]): Promise<IRating[]> => {
    return await Rating.find({ mangaId, userId: { $in: userIds } });
};

export const upsertRating = async (userId: string, mangaId: string, value: number): Promise<IRating | null> => {
    return await Rating.findOneAndUpdate(
        { userId, mangaId },
        { $set: { value } },
        { returnDocument: "after", runValidators: true, upsert: true }
    );
};

export const deleteRating = async (userId: string, mangaId: string): Promise<IRating | null> => {
    return await Rating.findOneAndDelete({ userId, mangaId });
};

export const deleteManyRatingsByMangaId = async (mangaId: string) => {
    return await Rating.deleteMany({ mangaId });
};

export const getRatingDistribution = async (mangaId: string): Promise<Record<string, number>> => {
    const rows = await Rating.aggregate<{ _id: number; count: number }>([
        { $match: { mangaId: new mongoose.Types.ObjectId(mangaId) } },
        { $group: { _id: "$value", count: { $sum: 1 } } },
    ]);

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

    for (const row of rows) {
        distribution[String(row._id)] = row.count;
    }

    return distribution;
};

export const syncMangaRatingStats = async (mangaId: string): Promise<void> => {
    const [stats] = await Rating.aggregate<{ average: number; count: number }>([
        { $match: { mangaId: new mongoose.Types.ObjectId(mangaId) } },
        { $group: { _id: "$mangaId", average: { $avg: "$value" }, count: { $sum: 1 } } },
    ]);

    await Manga.updateOne(
        { _id: mangaId },
        {
            $set: {
                ratingAverage: stats ? Math.round(stats.average * 100) / 100 : 0,
                ratingCount: stats?.count ?? 0,
            },
        }
    );
};
