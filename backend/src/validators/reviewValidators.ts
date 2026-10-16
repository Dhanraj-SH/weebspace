import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common.js";

export const reviewIdSchema = z.object({ reviewId: objectIdSchema });

export const reviewListQuerySchema = paginationSchema;

const ratingField = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
    content: z.string().trim().min(1).max(5000),
    rating: ratingField.optional(),
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z
    .object({
        content: z.string().trim().min(1).max(5000).optional(),
        rating: ratingField.optional(),
    })
    .refine((data) => data.content !== undefined || data.rating !== undefined, {
        message: "Provide content or rating to update",
    });

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;