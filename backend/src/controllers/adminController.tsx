import type { Request, Response, NextFunction } from "express";
import { getAllUsersService, updateUserRole } from "../services/userService.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { updateUserRoleSchema, userIdSchema } from "../validators/userValidator.js";

export const getAllUsers = async(_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const users = await getAllUsersService();

        res.status(200).json({
            users
        });
    } catch(error) {
        next(error);
    }
};

export const updateRole = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });
    
            return;
        }
    
        const idResponse = userIdSchema.safeParse(req.params);
    
        if(!idResponse.success){
            res.status(400).json({
                message: "Invalid user id",
                error: idResponse.error.issues
            });
    
            return;
        }

        const response = updateUserRoleSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message: "Validation required",
                error: response.error.issues
            });

            return;
        }

        const user = await updateUserRole(idResponse.data.userId, response.data);

        res.status(200).json({
            message: "User role update successfully",
            user
        });
    } catch(error) {
        next(error);
    }
}