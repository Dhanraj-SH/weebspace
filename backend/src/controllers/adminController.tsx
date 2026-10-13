import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getAllUsersService, updateUserRole } from "../services/userService.js";
import { countAdmins, findUserById } from "../repositories/userRepository.js";
import { UserRole } from "../models/userModel.js";
import { updateUserRoleSchema, userIdSchema } from "../validators/userValidator.js";

export const getAllUsers = async ( _req: Request, res: Response, next: NextFunction ): Promise<void> => {
    try {
        const users = await getAllUsersService();

        res.status(200).json({ 
            users 
        });
    } catch (error) {
        next(error);
    }
};

export const updateRole = async ( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                message: "Authentication required",
            });

            return;
        }

        const idResponse = userIdSchema.safeParse(req.params);

        if (!idResponse.success) {
            res.status(400).json({
                message: "Invalid user ID",
                error: idResponse.error.issues,
            });

            return;
        }

        const response = updateUserRoleSchema.safeParse(req.body);

        if (!response.success) {
            res.status(400).json({
                message: "Invalid role",
                error: response.error.issues,
            });

            return;
        }

        const targetUserId = idResponse.data.userId;
        const requestedRole = response.data.role;

        if ( req.userId === targetUserId && requestedRole !== UserRole.Admin ) {
            res.status(403).json({
                message: "You cannot demote yourself",
            });

            return;
        }

        const targetUser = await findUserById(targetUserId);

        if (!targetUser) {
            res.status(404).json({
                message: "User not found",
            });

            return;
        }

        if ( targetUser.role === UserRole.Admin && requestedRole !== UserRole.Admin ) {
            const adminCount = await countAdmins();

            if (adminCount <= 1) {
                res.status(409).json({
                    message: "Cannot remove the last admin",
                });

                return;
            }
        }

        const user = await updateUserRole( targetUserId, response.data );

        if (!user) {
            res.status(404).json({
                message: "User not found",
            });
            
            return;
        }

        res.status(200).json({
            message: "User role updated successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};