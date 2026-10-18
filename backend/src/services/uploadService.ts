import { createUploadUrl } from "../providers/storageProvider.js";
import { findChapterById } from "../repositories/chapterRepository.js";
import { findMangaById } from "../repositories/mangaRepository.js";
import { AppError } from "../utils/appError.js";
import { buildCoverKey, buildPageKey } from "../utils/storageKeys.js";
import type { PresignUploadData } from "../validators/uploadValidators.js";
import { resolveMediaUrl } from "../utils/mediaURL.js";

export const createPresignedUpload = async (input: PresignUploadData) => {
    if(!(await findMangaById(input.mangaId))){
        throw new AppError("Manga not found", 404);
    }

    let key: string;

    if(input.purpose === 'cover'){
        key = buildCoverKey(input.mangaId, input.contentType);
    } else {
        const chapter = await findChapterById(input.chapterId);

        if(!chapter) {
            throw new AppError("Chapter not found", 404);
        }

        if(chapter.mangaId.toString() !== input.mangaId) {
            throw new AppError("Chapter does not belong to manga", 400);
        }

        key = buildPageKey(input.mangaId, input.chapterId, input.contentType);
    }

    return {
        uploadUrl: await createUploadUrl(key, input.contentType, input.size),
        key,
        publicUrl: resolveMediaUrl(key),
        requiredHeaders: {"Content-Type": input.contentType}
    };
};