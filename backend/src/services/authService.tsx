import bcrypt from 'bcrypt';
import { findUserByEmail, findUserByGoogleId, findUserByUsername, createUser, findUserByIdentifierWithPassword, findUserById } from '../repositories/userRepository.js';
import type { RegisterUserData, LoginUserData } from '../validators/authValidators.js';
import type { GoogleProfile } from '../providers/googleAuthProvider.js';
import { AppError } from '../utils/appError.js';
import { generateAccessToken } from '../utils/generateAccessToken.js';
import { generateRefreshToken } from '../utils/generateRefreshToken.js';
import { verifyRefreshToken } from '../utils/verifyRefreshToken.js';
import { access } from 'node:fs';

export const registerUser = async(userData: RegisterUserData) => {
    const existingEmail = await findUserByEmail(userData.email);

    if(existingEmail){
        throw new AppError("Email is already registered", 409);
    }

    const existingUsername = await findUserByUsername(userData.username);

    if(existingUsername){
        throw new AppError("Username is already taken", 409);
    }

    const hashPassword = await bcrypt.hash(userData.password, 12);

    const user = await createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashPassword
    });

    return user;
};

export const loginUser = async(userData: LoginUserData) => {
    const user = await findUserByIdentifierWithPassword(userData.identifier);

    if(!user || !user.password){
        throw new AppError("Invalid credentails", 401);
    }

    const passwordMatches = await bcrypt.compare(userData.password, user.password);

    if(!passwordMatches){
        throw new AppError("Invalid credentails", 401);
    }

    const userId = user._id.toString();

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return {
        user,
        accessToken,
        refreshToken
    };
};

export const loginWithGoogle = async(profile: GoogleProfile) => {
    const existingGoogleUser = await findUserByGoogleId(profile.googleId);

    if(existingGoogleUser){
        const userId = existingGoogleUser._id.toString();

        return {
            user: existingGoogleUser,
            accessToken: generateAccessToken(userId),
            refreshToken: generateRefreshToken(userId)
        };
    }

    const existingEmailUser = await findUserByEmail(profile.email);

    if(existingEmailUser){
        throw new AppError("An account with this email already exists. Sign in using your existing login method.", 409);
    }

    const emailPrefix = profile.email.split("@")[0] ?? "reader";

    const baseUsername = emailPrefix.toLocaleLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "").slice(0, 20) || "reader";

    let username = baseUsername;
    let suffix = 1;

    while(await findUserByUsername(username)){
        username = `${baseUsername}_${suffix}`;
        suffix++;
    }

    const user = await createUser({
        name: profile.name,
        username,
        email: profile.email,
        googleId: profile.googleId,
        ...(profile.avatar ? { avatar: profile.avatar }: {})
    });

    const userId = user._id.toString();

    return {
        user,
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId)
    };
};

export const getCurrentUser = async (userId: string) => {
    const user = await findUserById(userId);

    if(!user){
        throw new AppError("User not found", 404);
    }

    return user;
}

export const refreshAccessToken = (refreshToken: string): string => {
    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken(decoded.userId);
    return accessToken;
}