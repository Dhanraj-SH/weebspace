import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const chapterIdSchema = z.object({ chapterId: objectIdSchema });

export const createChapterSchema = z.object({
    chapterNumber: z.number().min(0),
    title: z.string().trim().min(1).optional(),
    pages: z.array(z.url()).default([]),
    publishedAt: z.coerce.date().optional(),
});

export type CreateChapterData = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z.object({
    chapterNumber: z.number().min(0).optional(),
    title: z.string().trim().min(1).optional(),
    pages: z.array(z.url()).optional(),
    publishedAt: z.coerce.date().optional(),
});

export type UpdateChapterData = z.infer<typeof updateChapterSchema>;
