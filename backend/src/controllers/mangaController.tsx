import { type Request, type Response, type NextFunction, response } from "express";
import { getAllManga, getMangaById, createManga, updateManga, deleteManga } from "../services/mangaService.js";
import { mangaIdSchema, createMangaSchema, updateMangaSchema } from "../validators/mangaValidators.js";

export const getManga = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const manga = await getAllManga();

        res.status(200).json({
            manga
        });
    } catch(error) {
        next(error);
    }
};

export const getMangaByIdController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = mangaIdSchema.safeParse(req.params);

    if(!response.success){
        res.status(400).json({
            message: "Invalid manga Id",
            error: response.error.issues
        });

        return;
    }
    
    try {
        const manga = await getMangaById(response.data.mangaId);

        if(!manga){
            res.status(404).json({
                message: "Manga not found"
            });

            return;
        }

        res.status(200).json({
            manga
        });

    } catch(error) {
        next(error);
    }
};

export const createMangaController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = createMangaSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message: "Validation Failed",
            error: response.error.issues
        });

        return;
    }

    try {
        const manga = await createManga(response.data);

        res.status(201).json({
            message: "Manga created successfully",
            manga
        });
    } catch(error) {
        next(error);
    }
};

export const updateMangaController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idResponse = mangaIdSchema.safeParse(req.params);

    if(!idResponse.success){
        res.status(400).json({
            message: "Invalid manga Id",
            error: idResponse.error.issues
        });

        return;
    }

    const response = updateMangaSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message: "Validation failed",
            error: response.error.issues
        });

        return;
    }

    try {
        const manga = await updateManga(idResponse.data.mangaId, response.data);

        if(!manga){
            res.status(404).json({
                message: "Manga not found"
            });

            return;
        }

        res.status(200).json({
            message: "Manga Updated successfully",
            manga: manga
        });
    } catch(error) {
        next(error);
    }

}

export const deleteMangaController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = mangaIdSchema.safeParse(req.params);

    if(!response.success){
        res.status(400).json({
            message: "Invalid manga Id",
            error: response.error.issues
        });

        return;
    }

    try {
        const manga = await deleteManga(response.data.mangaId);

        if(!manga) {
            res.status(404).json({
                message: "Manga not found",
            });

            return;
        }

        res.status(200).json({
            message: "Manga deleted successfully",
            manga: manga
        });
    } catch(error) {
        next(error);
    }
}