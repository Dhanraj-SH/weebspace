import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { createReviewSchema, reviewIdSchema, updateReviewSchema } from "../validators/reviewValidators.js";
import { createReviewService, deleteReviewService, fetchByMangaId, fetchByReviewId, updateReviewService } from "../services/reviewService.js";
import { isRecursiveSchema } from "zod/v4/core";

export const createReview = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    
        const response = createReviewSchema.safeParse(req.body);
    
        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });
    
            return;
        }
    
        const review = await createReviewService(req.userId, idResponse.data.mangaId, response.data);
    
        res.status(201).json({
            message: "Review created successfully",
            review
        });
    } catch(error) {
        next(error);
    }
};

export const getReviewByManga = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{

        const idResponse = mangaIdSchema.safeParse(req.params);

        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid Manga id",
                error: idResponse.error.issues
            });

            return;
        }

        const review = await fetchByMangaId(idResponse.data.mangaId);

        res.status(200).json({
            review
        });
    } catch(error) {
        next(error);
    }
};

export const getReview = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{

        const idResponse = reviewIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid Review Id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const review = await fetchByReviewId(idResponse.data.reviewId);
    
        if(!review){
            res.status(404).json({
                message: "Review not found"
            });
    
            return;
        }
    
        res.status(200).json({
            review
        });
    } catch(error) {
        next(error);
    }
};

export const updateReview = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const idResponse = reviewIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(401).json({
                message: "Invalid review id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const response = updateReviewSchema.safeParse(req.body);
    
        if(!response.success){
            res.status(401).json({
                message: "Validation required",
                error: response.error.issues
            });
    
            return;
        }

        const review = await updateReviewService(req.userId, idResponse.data.reviewId, response.data);

        if(!review){
            res.status(404).json({
                message: "Review not found"
            });

            return;
        }

        res.status(200).json({
            message: "Review updated successfully",
            review
        });
    } catch(error) {
        next(error);
    }
};

export const deleteReview = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const idResponse = reviewIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid manga Id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const review = await deleteReviewService(req.userId, idResponse.data.reviewId);
    
        if(!review){
            res.status(404).json({
                message: "Review not found",
            });
    
            return;
        }
    
        res.status(200).json({
            message: "Review deleted successfully",
            review
        });

    } catch(error) {
        next(error);
    }
};