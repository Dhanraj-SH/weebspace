import { resolveMediaUrl } from "../utils/mediaUrl.js";

type MayBeDocument = { toJSON? : () => unknown};

const toPlain = (value: unknown): Record<string, unknown> => {
    const maybe = value as MayBeDocument;

    return (typeof maybe.toJSON === "function" ? maybe.toJSON(): value) as Record<string, unknown>;
};

export const toMangaDto = (manga: unknown) => {
    const plain = toPlain(manga);

    return typeof plain.coverImage === "string" ? { ...plain, coverImage: resolveMediaUrl(plain.coverImage)}: plain;
};

export const toChapterDto = (chapter: unknown) => {
    const plain = toPlain(chapter);

    return Array.isArray(plain.pages)
        ? { ...plain, pages: plain.pages.map((page) => resolveMediaUrl(String(page))) }
        : plain;
};