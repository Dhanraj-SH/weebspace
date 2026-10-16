import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./appError.js";

interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });

        if (typeof decoded === "string" || typeof decoded.userId !== "string" || typeof decoded.tokenVersion !== "number") {
            throw new Error("bad payload");
        }

        return { userId: decoded.userId, tokenVersion: decoded.tokenVersion };
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }
};
