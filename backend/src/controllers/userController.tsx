import { getUserById as fetchUser, updateProfileById } from "../services/userService.js";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { updateProfileSchema, userIdSchema } from "../validators/userValidator.js";
import { error } from "node:console";

export const getMe = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const user = await fetchUser(req.userId);

        if(!user){
            res.status(404).json({
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            user,
        });
    } catch(error) {
        next(error);
    }
};

export const getUserById = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        const idResponse = userIdSchema.safeParse(req.params);

        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid user Id",
                error: idResponse.error.issues
            });

            return;
        }

        const user = await fetchUser(idResponse.data.userId);

        if(!user){
            res.status(404).json({
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const response = updateProfileSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation failed",
                error: response.error.issues
            });

            return;
        }

        const user = await updateProfileById(req.userId, response.data);

        if(!user){
            res.status(404).json({
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            message: "Update profile successfully",
            user
        });
    } catch(error) {
        next(error);
    }
};

export const updateUserById = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const idResponse = userIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid user Id",
                error: idResponse.error.issues
            });
    
            return;
        }
    
        if(req.userId !== idResponse.data.userId){
            res.status(403).json({
                message: "Access restricted to update another user"
            });
    
            return;
        }
    
        const response = updateProfileSchema.safeParse(req.body);
    
        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });
    
            return;
        }
    
        const user = await updateProfileById(idResponse.data.userId, response.data);
    
        if(!user){
            res.status(404).json({
                message: "User not found"
            });
    
            return;
        }
    
        res.status(200).json({
            message: "User updated successfully",
            user,
        });
    } catch(error) {
        next(error);
    }   
};