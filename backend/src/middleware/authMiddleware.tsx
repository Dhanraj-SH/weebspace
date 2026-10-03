import "dotenv/config"
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { object } from "zod";

interface JwtPlayload{
    userId: string
}

export interface AuthenticatedRequest extends Request{
    userId?: string
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const authorization = req.headers.authorization;

        if(!authorization){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const [schema, token] = authorization.split(" ");

        if(schema !== "Bearer" || !token){
            res.status(401).json({
                message: "Invalid authorization header"
            });

            return;
        }

        const secret = process.env.JWT_ACCESS_SECRET;

        if(!secret){
            throw new Error("JWT_ACCESS_SECRET is not configured");
        }

        const decoded = jwt.verify(token, secret) as JwtPlayload;

        if(typeof decoded !== "object" || decoded === null || typeof decoded.userId !== "string"){
            res.status(401).json({
                message: "Invalid token playload"
            });
            
            return;
        }

        req.userId = decoded.userId;
        next();

    }catch(error){
        if(error instanceof jwt.JsonWebTokenError){
            res.status(401).json({
                message: "Invalid or Expired Token"
            });

            return;
        }

        next(error);
    }
}