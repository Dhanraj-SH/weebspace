import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getLibraryByUserId, createLibrary as createLibraryService, updateLibraryById, deleteLibraryById } from "../services/libraryService.js";
import { createLibrarySchema, updateLibrarySchema } from "../validators/libraryValidators.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";

export const getLibrary = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const library = await getLibraryByUserId(req.userId);
    
        res.status(200).json({
            library,
        });
    } catch(error) {
        next(error);
    }
};

export const createLibrary = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const response = createLibrarySchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation failed",
                error: response.error.issues
            });

            return;
        }

        const library = await createLibraryService(req.userId, response.data);

        res.status(201).json({
            library,
        });
    } catch(error) {
        next(error);
    }
};

export const updateLibrary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId) {
            res.status(401).json({
                message: "Authentication required",
            });

            return;
        }

        const idResponse = mangaIdSchema.safeParse(req.params);

        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid manga Id",
                error: idResponse.error.issues
            });

            return;
        }

        const resposne = updateLibrarySchema.safeParse(req.body);
        
        if(!resposne.success){
            res.status(400).json({
                message: "Validation required",
                error: resposne.error.issues
            });

            return;
        }

        const library = await updateLibraryById(req.userId, idResponse.data.mangaId, resposne.data);
    
        if(!library){
            res.status(404).json({
                message: "Manga is present your library"
            });

            return;
        }

        res.status(200).json({
            library,
        });

    } catch(error) {
        next(error);
    }
};

export const deleteLibrary = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required",
            });
    
            return;
        }
    
        const idResponse = mangaIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid manga id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const library = await deleteLibraryById(req.userId, idResponse.data.mangaId);
    
        if(!library){
            res.status(404).json({
                message: "Manga doesn't exists in your library"
            });
    
            return;
        }

        res.status(200).json({
            message: "Mange removed from library",
            library
        });
    } catch(error) {
        next(error);
    }
};