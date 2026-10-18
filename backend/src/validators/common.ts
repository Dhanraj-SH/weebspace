import { z } from "zod";
import { STORAGE_KEY_PATTERN } from "../utils/storageKeys.js";

export const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
    .transform((value) => value.toLowerCase());

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Username must be 3-20 characters: letters, numbers, underscore");

export const mediaRefSchema = z.union([z.url(), z.string().regex(STORAGE_KEY_PATTERN, "Invalid file key")]);