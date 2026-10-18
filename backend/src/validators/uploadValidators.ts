import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const MAX_PAGE_BYTES = 10 * 1024 * 1024;

const contentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const presignUploadSchema = z.discriminatedUnion("purpose",[
    z.object({
        purpose: z.literal("cover"),
        mangaId: objectIdSchema,
        contentType: contentTypeSchema,
        size: z.number().int().positive().max(MAX_COVER_BYTES)
    }),

    z.object({
        purpose: z.literal("page"),
        mangaId: objectIdSchema,
        chapterId: objectIdSchema,
        contentType: contentTypeSchema,
        size: z.number().int().positive().max(MAX_PAGE_BYTES)
    }),
]);

export type PresignUploadData = z.infer<typeof presignUploadSchema>;