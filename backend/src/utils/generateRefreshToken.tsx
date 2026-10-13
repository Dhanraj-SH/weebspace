import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const generateRefreshToken = (userId: string, tokenVersion: number): string => {
    return jwt.sign({ userId, tokenVersion }, env.JWT_REFRESH_SECRET, { algorithm: "HS256", expiresIn: "7d" });
};
