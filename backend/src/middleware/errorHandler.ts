import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

interface HttpErrorLike extends Error {
    statusCode?: number;
    status?: number;
    code?: string | number;
}

const codeForStatus = (status: number): string => {
    switch (status) {
        case 400: return "BAD_REQUEST";
        case 401: return "UNAUTHORIZED";
        case 403: return "FORBIDDEN";
        case 404: return "NOT_FOUND";
        case 409: return "CONFLICT";
        case 429: return "TOO_MANY_REQUESTS";
        default: return status >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR";
    }
};

const send = (res: Response, status: number, code: string, message: string, details: unknown[] = []): void => {
    res.status(status).json({ error: { code, message, details } });
};

export const errorHandler = (error: HttpErrorLike, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof SyntaxError && "body" in error) {
        send(res, 400, "INVALID_JSON", "Request body contains malformed JSON");
        return;
    }

    if (error instanceof ZodError) {
        send(res, 400, "VALIDATION_FAILED", "Request validation failed", error.issues);
        return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
        send(res, 400, "VALIDATION_FAILED", "Request validation failed", Object.values(error.errors).map((e) => e.message));
        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        send(res, 400, "INVALID_ID", "A supplied ID or field value is invalid");
        return;
    }

    if (error.code === 11000) {
        send(res, 409, "DUPLICATE_RESOURCE", "A record with this value already exists");
        return;
    }

    const status = typeof error.statusCode === "number" ? error.statusCode : typeof error.status === "number" ? error.status : 500;

    if (status >= 500) {
        console.error(error);
        send(res, status, codeForStatus(status), "Internal server error");
        return;
    }

    send(res, status, codeForStatus(status), error.message);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
    send(res, 404, "NOT_FOUND", "Route not found");
};
