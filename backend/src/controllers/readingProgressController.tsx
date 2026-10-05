import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { deleteReadingProgressById, getReadingProgessById, saveReadingProgress } from "../services/readingProgressService.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { updateReadingProgressSchema } from "../validators/readingProgressValidators.js";
import { error } from "node:console";

export const getReadingProgess = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Autentication required"
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

        const progress = await getReadingProgessById(req.userId, idResponse.data.mangaId);
        
        if(!progress){
            res.status(404).json({
                message: "Manga not found"
            });

            return;
        }

        res.status(200).json({
            progress
        });
    } catch(error) {
        next(error);
    }
};

export const saveProgress = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Validation request"
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

        const response = updateReadingProgressSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });
            
            return;
        }

        const progress = await saveReadingProgress(req.userId, idResponse.data.mangaId, response.data);

        if(!progress){
            res.status(404).json({
                message: "Manga not found"
            });

            return;
        }

        res.status(200).json({
            progress
        });
    } catch(error) {
        next(error);
    }
};

export const deleteProgress = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const idResponse = mangaIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invaild Manga id"
            });
    
            return;
        }
    
        const progress = await deleteReadingProgressById(req.userId, idResponse.data.mangaId);
    
        if(!progress){
            res.status(404).json({
                message: "Reading progress not found"
            });
    
            return;
        }
    
        res.status(200).json({
            message: "Progress deleted successfully",
            progress
        });
    } catch(error) {
        next(error);
    }
};