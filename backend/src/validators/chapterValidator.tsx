import {z} from 'zod';

export const chapterIdSchema = z.object({
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export const createChapterSchema = z.object({
    chapterNumber: z.number().min(0),
    title: z.string().trim().optional(),
    pages: z.array(z.string()).default([]),
    publishedAt: z.coerce.date().optional(),
});

export type CreateChapterData = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z.object({
    chapterNumber: z.number().min(0).optional(),
    title: z.string().trim().optional(),
    pages: z.array(z.string()).optional(),
    publishedAt: z.coerce.date().optional(),
});

export type UpdateChapterData = z.infer<typeof updateChapterSchema>;