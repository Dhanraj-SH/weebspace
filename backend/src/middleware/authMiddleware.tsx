import "dotenv/config"
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

        const secret = process.env.JWT_SECRET || "alternativeSecret";

        const decoded = jwt.verify(token, secret) as JwtPlayload;

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