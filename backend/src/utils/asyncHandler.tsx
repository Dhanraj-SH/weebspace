import type { NextFunction, Request, RequestHandler, Response } from "express";

type Handler<R extends Request> = (req: R, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = <R extends Request = Request>(handler: Handler<R>): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req as R, res, next)).catch(next);
    };
};
