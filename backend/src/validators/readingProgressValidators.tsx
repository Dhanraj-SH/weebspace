import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common.js";

export const updateReadingProgressSchema = z.object({
    chapterId: objectIdSchema,
    pageNumber: z.number().int().min(1),
});

export type UpdateProgressData = z.infer<typeof updateReadingProgressSchema>;

export const progressListQuerySchema = paginationSchema;
