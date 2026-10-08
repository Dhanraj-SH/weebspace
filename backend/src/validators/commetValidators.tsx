import { z } from 'zod';

export const createCommentSchema = z.object({
    content: z.string().trim().min(1).max(500),
    parentCommentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional() 
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
    content: z.string().trim().min(1).max(500)
});

export type UpdateCommentData = z.infer<typeof updateCommentSchema>;

export const commentIdSchema = z.object({
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});