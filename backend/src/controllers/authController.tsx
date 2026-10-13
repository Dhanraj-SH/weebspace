import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { env, isProduction } from "../config/env.js";
import { toOwnUser } from "../dtos/userDto.js";
import { getGoogleAuthUrl, getGoogleProfile } from "../providers/googleAuthProvider.js";
import { loginUser, loginWithGoogle, logoutSession, refreshSession, registerUser } from "../services/authService.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from "../utils/refreshCookie.js";
import { sendSuccess } from "../utils/response.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

const OAUTH_STATE_COOKIE = "weebspace_oauth_state";

const oauthStateCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth/google/callback",
} as const;

const readRefreshToken = (req: Request): string | undefined => {
    const fromCookie: unknown = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof fromCookie === "string" && fromCookie) return fromCookie;

    const fromBody: unknown = req.body?.refreshToken;
    return typeof fromBody === "string" && fromBody ? fromBody : undefined;
};

export const register = asyncHandler(async (req, res) => {
    const user = await registerUser(registerSchema.parse(req.body));

    sendSuccess(res, 201, toOwnUser(user), { message: "User registered" });
});

export const login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await loginUser(loginSchema.parse(req.body));

    setRefreshCookie(res, refreshToken);

    sendSuccess(res, 200, { accessToken, user: toOwnUser(user) }, { message: "Login successful" });
});

export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);

    if (!refreshToken) {
        throw new AppError("Refresh token required", 401);
    }

    sendSuccess(res, 200, { accessToken: await refreshSession(refreshToken) });
});

export const logout = asyncHandler(async (req, res) => {
    await logoutSession(readRefreshToken(req));

    clearRefreshCookie(res);

    sendSuccess(res, 200, null, { message: "Logout successful" });
});

export const googleLogin = asyncHandler(async (_req, res) => {
    const state = randomBytes(32).toString("hex");

    res.cookie(OAUTH_STATE_COOKIE, state, { ...oauthStateCookieOptions, maxAge: 10 * 60 * 1000 });
    res.redirect(getGoogleAuthUrl(state));
});

const redirectToLoginWithError = (res: Response, message: string): void => {
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
};

export const googleCallback = asyncHandler(async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const returnedState = typeof req.query.state === "string" ? req.query.state : undefined;
    const cookieState: unknown = req.cookies?.[OAUTH_STATE_COOKIE];

    res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions);

    if (!code || !returnedState || typeof cookieState !== "string") {
        redirectToLoginWithError(res, "Invalid Google sign-in response");
        return;
    }

    const returnedBuffer = Buffer.from(returnedState);
    const cookieBuffer = Buffer.from(cookieState);

    if (returnedBuffer.length !== cookieBuffer.length || !timingSafeEqual(returnedBuffer, cookieBuffer)) {
        redirectToLoginWithError(res, "Google sign-in could not be verified");
        return;
    }

    try {
        const { refreshToken } = await loginWithGoogle(await getGoogleProfile(code));

        setRefreshCookie(res, refreshToken);
        res.redirect(`${env.FRONTEND_URL}/auth/callback`);
    } catch (error) {
        if (error instanceof AppError) {
            redirectToLoginWithError(res, error.message);
            return;
        }

        throw error;
    }
});
