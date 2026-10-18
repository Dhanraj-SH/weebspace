import { deleteByPrefix, headObject } from "../providers/storageProvider.js";
import { AppError } from "../utils/appError.js";
import { isStorageKey } from "../utils/storageKeys.js"

export const verifyStoredFiles = async (values: string[], ownerPrefix: string): Promise<void> => {
    const keys = values.filter(isStorageKey);

    if(keys.length === 0) return;

    if(keys.some((key) => !key.startsWith(ownerPrefix))) {
        throw new AppError("A file does not belong to this item", 400);
    }

    const found = await Promise.all(keys.map((key) => headObject(key)));

    if(found.some((result) => result === null)) {
        throw new AppError("Uploaded file not found in storage", 400);
    }
};

export const removeStoredFiles = async (prefix: string): Promise<void> => {
    try {
        await deleteByPrefix(prefix);
    } catch(error) {
        console.error(`R2 cleaup failed for prefix "${prefix}"`, error);
    }
};