import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authMiddleware.js";
import { findUserById } from "../repositories/userRepository.js";
import { UserRole } from "../models/userModel.js";

export const authorize = (...roles: UserRole[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try{
            if(!req.userId) {
                res.status(401).json({
                    message: "Authentication required",
                });

                return;
            }

            const user = await findUserById(req.userId);

            if(!user) {
                res.status(401).json({
                    message: "User not found",
                });

                return;
            }

            if(!roles.includes(user.role)) {
                res.status(403).json({
                    message: "You are not authorized to perform this action",
                });

                return;
            }

            next();
        } catch(error) {
            next(error);
        }
    };
};