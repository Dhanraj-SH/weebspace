import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common.js";

export const commentIdSchema = z.object({ commentId: objectIdSchema });

export const commentListQuerySchema = paginationSchema;

export const createCommentSchema = z.object({
    content: z.string().trim().min(1).max(500),
    parentCommentId: objectIdSchema.optional(),
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
    content: z.string().trim().min(1).max(500),
});

export type UpdateCommentData = z.infer<typeof updateCommentSchema>;
