import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

export interface GoogleProfile {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}

const getGoogleOAuthClient = (): OAuth2Client => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL)");
    }

    return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
};

export const getGoogleAuthUrl = (state: string): string => {
    return getGoogleOAuthClient().generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "email", "profile"],
        prompt: "select_account",
        state,
    });
};

export const getGoogleProfile = async (code: string): Promise<GoogleProfile> => {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
        throw new Error("Google did not return an ID token");
    }

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true || !payload.name) {
        throw new Error("Google account information is missing or unverified");
    }

    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name,
        ...(payload.picture ? { avatar: payload.picture } : {}),
    };
};
