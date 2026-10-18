import { randomUUID } from "node:crypto";

export const IMAGE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
} as const;

export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;

export const mangaPrefix = (mangaId: string): string => 'manga/${mangaId}/';
export const chapterPrefix = (mangaId: string, chapterId: string) => 'manga/${mangaId}/chapters/${chapterId}';

export const buildCoverKey = (mangaId: string, contentType: ImageContentType): string => 
    `${mangaPrefix(mangaId)}cover/${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;

export const buildPageKey = (mangaId: string, chapterId: string, contentType: ImageContentType): string => 
    `${chapterPrefix(mangaId, chapterId)}${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;

export const STORAGE_KEY_PATTERN = /^manga\/[0-9a-f]{24}\/(cover|chapters\/[0-9a-f]{24})\/[A-Za-z0-9-]+\.(jpg|png|webp)$/;

export const isStorageKey = (value: string): boolean => STORAGE_KEY_PATTERN.test(value);