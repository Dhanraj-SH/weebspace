import { number, z } from 'zod';

export const reviewIdSchema = z.object({
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export const createReviewSchema = z.object({
    rating: z.number().min(1).max(5),
    content: z.string().trim().min(1).max(500)
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    content: z.string().trim().min(1).max(500).optional()
});

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;