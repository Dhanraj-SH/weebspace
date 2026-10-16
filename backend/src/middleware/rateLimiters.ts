import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    message: {
        error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts, please try again later", details: [] },
    },
});
