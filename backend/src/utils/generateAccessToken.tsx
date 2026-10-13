import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (userId: string): string => {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { algorithm: "HS256", expiresIn: "15m" });
};
