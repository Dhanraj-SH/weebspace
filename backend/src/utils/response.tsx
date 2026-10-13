import type { Response } from "express";

interface SuccessExtras {
    message?: string;
    meta?: Record<string, unknown>;
}

export const sendSuccess = <T,>(res: Response, status: number, data: T, extras: SuccessExtras = {}): void => {
    res.status(status).json({
        data,
        ...(extras.message !== undefined ? { message: extras.message } : {}),
        ...(extras.meta !== undefined ? { meta: extras.meta } : {}),
    });
};
