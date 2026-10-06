import { Rating, type IRating } from "../models/ratingModel.js";
import type { UpdateRatingData } from "../validators/ratingValidators.js";

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
}

export const deleteRatingByMangaId = async(mangaId: string) => {
    return await Rating.deleteMany({mangaId});
}