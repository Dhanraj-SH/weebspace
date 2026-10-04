import {z} from 'zod';
import { LibraryStatus } from '../models/libraryModel.js';

export const createLibrarySchema = z.object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    status: z.enum(LibraryStatus)
});

export type CreateLibraryData = z.infer<typeof createLibrarySchema>;

export const updateLibrarySchema = z.object({
    status: z.enum(LibraryStatus)
});

export type UpdateLibraryData = z.infer<typeof updateLibrarySchema>;