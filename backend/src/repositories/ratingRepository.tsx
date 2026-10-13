import { Manga } from "../models/mangaModel.js";
import { Rating, type IRating } from "../models/ratingModel.js";
import type { UpdateRatingData } from "../validators/ratingValidators.js";
import mongoose from "mongoose";

export const findRatingById = async(userId: string, mangaId: string): Promise<IRating | null> => {
    return await Rating.findOne({userId, mangaId});
};

export const upsertRatingById = async(userId: string, mangaId: string, ratingData: UpdateRatingData): Promise<IRating | null> => {
    return await Rating.findOneAndUpdate(
        {userId, mangaId},
        {
            $set:{
                value: ratingData.value
            } 
        },{
            returnDocument: "after",
            runValidators: true,
            upsert: true
        }
    );
};

export const deleteRatingById = async(userId: string, mangaId: string): Promise<IRating | null> => {
    return await Rating.findOneAndDelete({userId, mangaId});
};

export const deleteRatingByMangaId = async(mangaId: string) => {
    return await Rating.deleteMany({mangaId});
};

export const syncMangaRatingStats = async(mangaId: string): Promise<void> => {
    const [stats] = await Rating.aggregate([
        { $match: {mangaId: new mongoose.Types.ObjectId(mangaId) } },
        {
            $group: {
                _id: "$mangaId",
                average: { $avg: "$value" },
                count: { $sum: 1}
            }
        }
    ]);

    await Manga.updateOne(
        { _id: mangaId },
        {
            $set: {
                ratingAverage: stats?.average ?? 0,
                ratingCount: stats?.count ?? 0,
            },
        }
    );
};