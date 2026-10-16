import { z } from "zod";
import { LibraryStatus } from "../models/libraryModel.js";
import { objectIdSchema, paginationSchema } from "./common.js";

export const libraryQuerySchema = paginationSchema.extend({
    status: z.enum(LibraryStatus).optional(),
});

export type LibraryQuery = z.infer<typeof libraryQuerySchema>;

export const createLibrarySchema = z.object({
    mangaId: objectIdSchema,
    status: z.enum(LibraryStatus),
});

export type CreateLibraryData = z.infer<typeof createLibrarySchema>;

export const updateLibrarySchema = z.object({
    status: z.enum(LibraryStatus),
});

export type UpdateLibraryData = z.infer<typeof updateLibrarySchema>;
