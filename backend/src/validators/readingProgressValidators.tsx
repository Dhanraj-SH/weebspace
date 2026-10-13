import { z } from 'zod';

export const updateReadingProgressSchema = z.object({
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    pageNumber: z.number().min(1)
});

export type UpdateProgressData = z.infer<typeof updateReadingProgressSchema>;