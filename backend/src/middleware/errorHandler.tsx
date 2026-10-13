import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

interface AppErrorLike extends Error {
    statusCode?: number;
    status?: number;
    code?: string | number;
    errors?: Record<string, unknown>;
}

export const errorHandler = ( error: Error | AppErrorLike, _req: Request, res: Response, _next: NextFunction ): void => {

    if ( error instanceof SyntaxError && "body" in error ) {
        res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Request body contains malformed JSON",
                details: [],
            },
        });

        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            error: {
                code: "VALIDATION_FAILED",
                message: "Request validation failed",
                details: error.issues,
            },
        });

        return;
    }

    if ("code" in error && error.code === 11000) {
        res.status(409).json({
            error: {
                code: "DUPLICATE_RESOURCE",
                message: "A record with this value already exists",
                details: [],
            },
        });

        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({
            error: {
                code: "INVALID_ID",
                message: "A supplied ID or field value is invalid",
                details: [],
            },
        });

        return;
    }

    const statusCode = "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : "status" in error && typeof error.status === "number" ? error.status : 500;

    const message = statusCode < 500 ? error.message : "Internal server error";

    res.status(statusCode).json({
        error: {
            code: statusCode === 401 ? "UNAUTHORIZED" : statusCode === 403
                ? "FORBIDDEN" : statusCode === 404
                ? "NOT_FOUND" : statusCode === 409
                ? "CONFLICT" : statusCode === 400
                ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message,
            details: [],
        },
    });
};