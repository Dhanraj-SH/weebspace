import { type Request, type Response, type NextFunction, response } from "express";
import { getChapterById, getChaptersByMangaId, createChapter as createChapterService, updateChapter as updateChapterService, deleteChapter as deleteChapterService } from "../services/chapterService.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { chapterIdSchema, createChapterSchema, updateChapterSchema } from "../validators/chapterValidator.js";
import { error } from "node:console";

export const getChaptersByManga = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = mangaIdSchema.safeParse(req.params);

    if(!response.success){
        res.status(400).json({
            message: "Invalid manga id",
            error: response.error.issues
        });

        return;
    }

    try {
        const chapters = await getChaptersByMangaId(response.data.mangaId);

        res.status(200).json({
            chapters,
        });
    } catch(error) {
        next(error);
    }
};

export const getChapter = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = chapterIdSchema.safeParse(req.params);

    if(!response.success){
        res.status(400).json({
            message: "Invalid chapter Id",
            error: response.error.issues
        });

        return;
    };

    try{
        const chapter = await getChapterById(response.data.chapterId);

        if(!chapter){
            res.status(404).json({
                message: "Chapter not found"
            });

            return;
        }

        res.status(200).json({
            chapter,
        });

    } catch(error) {
        next(error);
    }
};

export const createChapter = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idResponse = mangaIdSchema.safeParse(req.params);

    if(!idResponse.success){
        res.status(400).json({
            message: "Invalid manga Id",
            error: idResponse.error.issues
        });

        return;
    }

    const response = createChapterSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message: "Validation required",
            error: response.error.issues
        });

        return;
    }

    try{
        const chapter = await createChapterService(idResponse.data.mangaId, response.data);

        res.status(201).json({
            message: "Chapter added successfully",
            chapter
        });
    } catch(error) {
        next(error);
    }
};

export const updateChapter = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idResponse = chapterIdSchema.safeParse(req.params);

    if(!idResponse.success){
        res.status(400).json({
            message: "Invalid chapter Id",
            error: idResponse.error.issues
        });
    
        return;
    }

    const response = updateChapterSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message: "Validation failed",
            error: response.error.issues
        });

        return;
    }

    try{
        const chapter = await updateChapterService(idResponse.data.chapterId, response.data);

        if(!chapter){
            res.status(404).json({
                message: "Chapter not found"
            });

            return;
        }

        res.status(200).json({
            message: "Chapter updated successfully",
            chapter,
        });
    } catch(error) {
        next(error);
    } 
};


export const deleteChapter = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idResponse = chapterIdSchema.safeParse(req.params);

    if(!idResponse.success){
        res.status(400).json({
            message: "Invalid chapter Id",
            error: idResponse.error.issues
        });

        return;
    }

    try{
        const chapter = await deleteChapterService(idResponse.data.chapterId);
        
        if(!chapter){
            res.status(404).json({
                message: "Chapter not found"
            });

            return;
        }

        res.status(200).json({
            message: "Chapter deleted successfuly",
            chapter,
        });
    } catch(error) {
        next(error);
    }
};