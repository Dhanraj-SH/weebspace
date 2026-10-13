import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

interface AccessTokenPayload {
    userId: string;
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        next(new AppError("Authentication required", 401));
        return;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        next(new AppError("Invalid authorization header", 401));
        return;
    }

    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });

        if (typeof decoded === "string" || typeof decoded.userId !== "string") {
            next(new AppError("Invalid token payload", 401));
            return;
        }

        req.userId = (decoded as AccessTokenPayload).userId;
        next();
    } catch {
        next(new AppError("Invalid or expired token", 401));
    }
};

export const requireUserId = (req: AuthenticatedRequest): string => {
    if (!req.userId) {
        throw new AppError("Authentication required", 401);
    }

    return req.userId;
};
