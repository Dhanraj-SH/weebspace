import { z } from "zod";
import { MangaStatus } from "../models/mangaModel.js";
import { mangaGenres } from "../models/mangaModel.js";

export const mangaIdSchema = z.object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export const createMangaSchema = z.object({
    title: z.string().trim().min(1).max(50),
    alternativeTitles: z.array(z.string().trim()).default([]),
    description: z.string().trim(),
    authors: z.array(z.string().trim()).default([]),
    artists: z.array(z.string().trim()).default([]),
    coverImage: z.string().trim(),
    genres: z.array(z.enum(mangaGenres)).default(["unknown"]),
    status: z.enum(MangaStatus).default(MangaStatus.Ongoing)
});

export type CreateMangaData = z.infer<typeof createMangaSchema>;

export const updateMangaSchema = z.object({
    title: z.string().trim().min(1).max(50).optional(),
    alternativeTitles: z.array(z.string().trim()).optional(),
    description: z.string().trim().optional(),
    authors: z.array(z.string().trim()).optional(),
    artists: z.array(z.string().trim()).optional(),
    coverImage: z.string().trim().optional(),
    genres: z.array(z.enum(mangaGenres)).optional(),
    status: z.enum(MangaStatus).optional()
});

export type UpdateMangaData = z.infer<typeof updateMangaSchema>;