import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env.js";
import { REFRESH_TOKEN_MAX_AGE_MS } from "./generateRefreshToken.js";

export const REFRESH_COOKIE_NAME = "weebspace_refresh";

const baseOptions = (): CookieOptions => ({
    httpOnly: true,
    secure: isProduction || env.COOKIE_SAME_SITE === "none",
    sameSite: env.COOKIE_SAME_SITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: "/api/v1/auth",
});

export const setRefreshCookie = (res: Response, token: string): void => {
    res.cookie(REFRESH_COOKIE_NAME, token, { ...baseOptions(), maxAge: REFRESH_TOKEN_MAX_AGE_MS });
};

export const clearRefreshCookie = (res: Response): void => {
    res.clearCookie(REFRESH_COOKIE_NAME, baseOptions());
};
