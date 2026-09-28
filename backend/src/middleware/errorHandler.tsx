import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(error);

    if(error instanceof AppError){
        res.status(error.statusCode).json({
            message: error.message
        });

        return;
    }

    res.status(500).json({
        message: "Internal server error"
    });
};