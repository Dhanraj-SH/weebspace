import mongoose, { Document, Schema } from "mongoose";

export const mangaGenres = [
    "action",
    "actionAdventure",
    "adventure",
    "animation",
    "awardWinning",
    "boysLove",
    "cars",
    "comedy",
    "dementia",
    "demons",
    "drama",
    "ecchi",
    "erotica",
    "fantasy",
    "game",
    "girlsLove",
    "gourmet",
    "harem",
    "historical",
    "horror",
    "isekai",
    "josei",
    "kids",
    "magic",
    "mahouShoujo",
    "martialArts",
    "mecha",
    "military",
    "music",
    "mystery",
    "parody",
    "police",
    "psychological",
    "romance",
    "samurai",
    "school",
    "sciFi",
    "sciFiFantasy",
    "seinen",
    "shoujo",
    "shoujoAi",
    "shounen",
    "shounenAi",
    "sliceOfLife",
    "space",
    "sports",
    "superPower",
    "supernatural",
    "suspense",
    "thriller",
    "unknown",
    "vampire",
] as const;

export enum MangaStatus {
    Ongoing = "ongoing",
    Completed = "completed",
    Hiatus = "hiatus",
}

export interface IManga extends Document {
    title: string;
    alternativeTitles: string[];
    description: string;
    authors: string[];
    artists: string[];
    coverImage?: string;
    genres: string[];
    status: MangaStatus;
    ratingAverage: number;
    ratingCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const mangaSchema = new Schema<IManga>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        alternativeTitles: {
            type: [String],
            default: [],
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        authors: {
            type: [String],
            required: true,
        },

        artists: {
            type: [String],
            required: true,
        },

        coverImage: {
            type: String,
        },

        genres: {
            type: [String],
            enum: mangaGenres,
            default: ["unknown"],
        },

        status: {
            type: String,
            enum: Object.values(MangaStatus),
            default: MangaStatus.Ongoing,
        },

        ratingAverage: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        ratingCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        viewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

export const Manga = mongoose.model<IManga>("Manga", mangaSchema);