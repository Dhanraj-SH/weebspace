import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";
import { commentIdSchema, createCommentSchema, updateCommentSchema } from "../validators/commetValidators.js";
import { createCommentByChapterService, createCommentService, deleteCommentService, getCommentByChapterService, getCommentByMangaService, updateCommentService } from "../services/commentService.js";
import { chapterIdSchema } from "../validators/chapterValidator.js";
import { error } from "node:console";

export const createComment = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    
        const response = createCommentSchema.safeParse(req.body);
    
        if(!response.success){
            res.status(400).json({
                message: "Validation required"
            });
    
            return;
        }
    
        const comment = await createCommentService(req.userId, idResponse.data.mangaId, response.data);
    
        res.status(201).json({
            comment
        });
    } catch(error) {
        next(error);
    }
};

export const getCommentByManga = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const idResponse = mangaIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid Manga id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const comment = await getCommentByMangaService(idResponse.data.mangaId);
    
        res.status(200).json({
            comment
        });
    } catch(error) {
        next(error);
    }
};

export const createCommentByChapter = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const idResponse = chapterIdSchema.safeParse(req.params);

        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid Chapter id",
                error: idResponse.error.issues
            });

            return;
        }

        const response = createCommentSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });

            return;
        }

        const comment = await createCommentByChapterService(req.userId, idResponse.data.chapterId, response.data);

        res.status(201).json({
            message: "Comment created successfully",
            comment
        });

    } catch(error) {
        next(error);
    }
};

export const getCommentByChapter = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{

        const idResponse = chapterIdSchema.safeParse(req.params);
        
        if(!idResponse.success){
            res.status(401).json({
                message: "Invalid Chapter id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const comment = await getCommentByChapterService(idResponse.data.chapterId);
    
        if(!comment){
            res.status(404).json({
                message: "Chapter not found"
            });
    
            return;
        }
    
        res.status(200).json({
            comment
        });
    } catch(error) {
        next(error);
    }
};

export const updateComment = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required",
            });
    
            return;
        }
    
        const idResponse = commentIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid comment id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        const response = updateCommentSchema.safeParse(req.body);
    
        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });
            
            return;
        }

        const comment = await updateCommentService(req.userId, idResponse.data.commentId, response.data);

        if(!comment){
            res.status(404).json({
                message: "Comment not found"
            });

            return;
        }

        res.status(200).json({
            message: "Comment update successfully",
            comment
        });
    } catch(error) {
        next(error);
    }
};

export const deleteComment = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }

        const idResponse = commentIdSchema.safeParse(req.params);

        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid comment id",
                error: idResponse.error.issues
            });

            return;
        }

        const comment = await deleteCommentService(req.userId, idResponse.data.commentId);

        if(!comment){
            res.status(404).json({
                message: "Comment not found"
            });

            return;
        }

        res.status(200).json({
            message: "Comment deleted successfully",
            comment
        });
    } catch(error) {
        next(error);
    }
};