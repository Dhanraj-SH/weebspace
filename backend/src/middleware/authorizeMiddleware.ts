import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authMiddleware.js";
import { findUserById } from "../repositories/userRepository.js";
import { UserRole } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";

export const authorize = (...roles: UserRole[]) => {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError("Authentication required", 401);
            }

            const user = await findUserById(req.userId);

            if (!user) {
                throw new AppError("User not found", 401);
            }

            if (!roles.includes(user.role)) {
                throw new AppError("You are not authorized to perform this action", 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
