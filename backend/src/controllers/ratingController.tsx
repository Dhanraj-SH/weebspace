import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { getRatingService, removeRatingService, saveRatingService } from "../services/ratingService.js";
import { updateRatingSchema } from "../validators/ratingValidators.js";

export const getRating = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
                message: "Invalid Manga id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const rating = await getRatingService(req.userId, idResponse.data.mangaId);
    
        if(!rating){
            res.status(404).json({
                message: "Rating not found"
            });
    
            return;
        }
    
        res.status(200).json({
            rating
        });
    } catch(error) {
        next(error);
    }
};

export const saveRating = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
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

        const response = updateRatingSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });

            return;
        }

        const rating = await saveRatingService(req.userId, idResponse.data.mangaId, response.data);

        if(!rating){
            res.status(404).json({
                message: "Manga not found"
            });

            return;
        }

        res.status(200).json({
            message: "Rating saved successfully",
            rating
        });

    } catch(error) {
        next(error);
    }
};

export const removeRating = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
                message: "Invalid manga id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const rating = await removeRatingService(req.userId, idResponse.data.mangaId);
    
        if(!rating){
            res.status(404).json({
                message: "Manga not found"
            });
    
            return;
        }
    
        res.status(200).json({
            message: "Rating Removed successfully",
            rating
        });
    }catch(error){
        next(error);
    }
};