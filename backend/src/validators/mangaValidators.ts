import { z } from "zod";
import { MangaStatus, mangaGenres } from "../models/mangaModel.js";
import { objectIdSchema, paginationSchema } from "./common.js";

export const mangaIdSchema = z.object({ mangaId: objectIdSchema });

const genresSchema = z.array(z.enum(mangaGenres)).transform((genres) => [...new Set(genres)]);

export const createMangaSchema = z.object({
    title: z.string().trim().min(1).max(200),
    alternativeTitles: z.array(z.string().trim().min(1)).default([]),
    description: z.string().trim().min(1),
    authors: z.array(z.string().trim().min(1)).default([]),
    artists: z.array(z.string().trim().min(1)).default([]),
    coverImage: z.url().optional(),
    genres: genresSchema.default(["unknown"]),
    status: z.enum(MangaStatus).default(MangaStatus.Ongoing),
});

export type CreateMangaData = z.infer<typeof createMangaSchema>;

export const updateMangaSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    alternativeTitles: z.array(z.string().trim().min(1)).optional(),
    description: z.string().trim().min(1).optional(),
    authors: z.array(z.string().trim().min(1)).optional(),
    artists: z.array(z.string().trim().min(1)).optional(),
    coverImage: z.url().optional(),
    genres: genresSchema.optional(),
    status: z.enum(MangaStatus).optional(),
});

export type UpdateMangaData = z.infer<typeof updateMangaSchema>;

export const listMangaQuerySchema = paginationSchema.extend({
    q: z.string().trim().max(100).optional(),
    genre: z.enum(mangaGenres).optional(),
    status: z.enum(MangaStatus).optional(),
    sortBy: z.enum(["ratingAverage", "createdAt", "title"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListMangaQuery = z.infer<typeof listMangaQuerySchema>;
