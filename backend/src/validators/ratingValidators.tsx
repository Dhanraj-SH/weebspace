import { z } from 'zod';

export const updateRatingSchema = z.object({
    value: z.number().min(1).max(5)
});

export type UpdateRatingData = z.infer<typeof updateRatingSchema>;