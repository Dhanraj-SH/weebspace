import bcrypt from "bcrypt";
import { findUserByEmail, findUserByGoogleId, findUserByUsername, createUser, findUserByIdentifierWithPassword, findUserById, incrementUserTokenVersion } from "../repositories/userRepository.js";
import type { RegisterUserData, LoginUserData } from "../validators/authValidators.js";
import type { GoogleProfile } from "../providers/googleAuthProvider.js";
import type { IUser } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";
import { verifyRefreshToken } from "../utils/verifyRefreshToken.js";

const BCRYPT_COST = 12;

const DUMMY_HASH = bcrypt.hashSync("weebspace-dummy-password", BCRYPT_COST);

const issueTokens = (user: IUser) => {
    const userId = user._id.toString();

    return {
        user,
        accessToken: generateAccessToken(userId, user.tokenVersion),
        refreshToken: generateRefreshToken(userId, user.tokenVersion),
    };
};

export const registerUser = async (userData: RegisterUserData) => {
    if (await findUserByEmail(userData.email)) {
        throw new AppError("Email is already registered", 409);
    }

    if (await findUserByUsername(userData.username)) {
        throw new AppError("Username is already taken", 409);
    }

    const password = await bcrypt.hash(userData.password, BCRYPT_COST);

    return await createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password,
    });
};

export const loginUser = async (userData: LoginUserData) => {
    const user = await findUserByIdentifierWithPassword(userData.identifier);

    const passwordMatches = await bcrypt.compare(userData.password, user?.password ?? DUMMY_HASH);

    if (!user || !user.password || !passwordMatches) {
        throw new AppError("Invalid credentials", 401);
    }

    return issueTokens(user);
};

const buildGoogleUsername = async (email: string): Promise<string> => {
    const emailPrefix = email.split("@")[0] ?? "";
    const cleaned = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");

    const base = cleaned.length >= 3 ? cleaned.slice(0, 14) : "reader";

    let username = base;
    let suffix = 1;

    while (await findUserByUsername(username)) {
        username = `${base}_${suffix}`;
        suffix++;
    }

    return username;
};

export const loginWithGoogle = async (profile: GoogleProfile) => {
    const existingGoogleUser = await findUserByGoogleId(profile.googleId);

    if (existingGoogleUser) {
        return issueTokens(existingGoogleUser);
    }

    if (await findUserByEmail(profile.email)) {
        throw new AppError("An account with this email already exists. Sign in using your existing login method.", 409);
    }

    const user = await createUser({
        name: profile.name,
        username: await buildGoogleUsername(profile.email),
        email: profile.email,
        googleId: profile.googleId,
        ...(profile.avatar ? { avatar: profile.avatar } : {}),
    });

    return issueTokens(user);
};

export const refreshSession = async (refreshToken: string): Promise<string> => {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await findUserById(decoded.userId);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new AppError("Refresh token is no longer valid", 401);
    }

    return generateAccessToken(user._id.toString(), user.tokenVersion);
};

export const logoutSession = async (refreshToken: string | undefined): Promise<void> => {
    if (!refreshToken) return;

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        return;
    }

    const user = await findUserById(decoded.userId);

    if (user && user.tokenVersion === decoded.tokenVersion) {
        await incrementUserTokenVersion(decoded.userId);
    }
};