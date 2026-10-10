import 'dotenv/config';
import { OAuth2Client } from "google-auth-library";

const getGoogleOAuthClient = (): OAuth2Client => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;


    if(!clientId || !clientSecret || !redirectUri){
        throw new Error("Missing Google OAuth envirnoment variables");
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
};

export const getGoogleAuthUrl = (): string => {
    const client = getGoogleOAuthClient();

    return client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "email", "profile"],
        prompt: "select_account"
    });
};

export interface GoogleProfile {
    googleId: string,
    email: string,
    name: string,
    avatar?: string
};

export const getGoogleProfile = async(code: string): Promise<GoogleProfile> => {
    const client = getGoogleOAuthClient();
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new Error("Missing Google OAuth environment variables");
    }

    const { tokens } = await client.getToken(code);

    if(!tokens.id_token){
        throw new Error("Google did not return an ID token");
    }

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
    });

    const payload = ticket.getPayload();

    if(!payload?.sub || !payload.email || !payload.email_verified !== true || !payload.name){
        throw new Error("Google account information is missing or unverified");
    }

    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name,
        ...(payload.picture ? {avatar: payload.picture} : {})
    }
};