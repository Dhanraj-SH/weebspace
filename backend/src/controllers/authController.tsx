import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, getCurrentUser, loginWithGoogle } from "../services/authService.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { verifyRefreshToken } from "../utils/verifyRefreshToken.js";
import { generateAccessToken } from "../utils/generateAccessToken.js" 
import { getGoogleAuthUrl, getGoogleProfile } from "../providers/googleAuthProvider.js";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { string, success } from "zod";
import { findUserById, incrementUserTokenVersion } from "../repositories/userRepository.js";

export const register = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = registerSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message: "Validation failed",
            error: response.error.issues
        });

        return;
    }
    try{
        const user = await registerUser(response.data);

        res.status(201).json({
            message: "User registered",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt
            }
        });

    } catch(error) {
        next(error);
    }
};


export const login = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const response = loginSchema.safeParse(req.body);

    if(!response.success){
        res.status(400).json({
            message:"Validation failed",
            error: response.error.issues
        });

        return;
    }

    try{
        const {user, accessToken, refreshToken} = await loginUser(response.data);

        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user:{
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch(error) {
        next(error);
    }
};

export const googleLogin = async(_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const state = randomBytes(32).toString("hex");

        res.cookie("weebspace_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
            path: "/api/v1/auth/google/callback"
        });

        res.redirect(getGoogleAuthUrl(state));
    } catch(error) {
        next(error);
    }
};

export const googleCallback = async(req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try{
        const code = typeof req.query.code === "string" ? req.query.code : undefined;
        const returnedState = typeof req.query.state === "string" ? req.query.state : undefined;

        const cookieState: unknown = req.cookies?.weebspace_oauth_state;

        res.clearCookie("weebspace_oauth_state", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/v1/auth/google/callback"
        })

        if(!code || !returnedState || typeof cookieState !== "string"){
            res.status(400).json({
                success: false,
                message: "Invalid or incomplete Google OAuth callback"
            });

            return;
        }

        const returnedBuffer = Buffer.from(returnedState);
        const cookieBuffer = Buffer.from(cookieState);

        if(returnedBuffer.length !== cookieBuffer.length || !timingSafeEqual(returnedBuffer, cookieBuffer)){
            res.status(400).json({
                success: false,
                message: "Google OAuth state validation failed",
            });

            return;
        }

        const profile = await getGoogleProfile(code);
        const response = await loginWithGoogle(profile);

        res.status(200).json({
            success: true,
            message: "Google authentication successful",
            data: {
                user: {
                    id: response.user._id.toString(),
                    name: response.user.name,
                    username: response.user.username,
                    email: response.user.email,
                    avatar: response.user.avatar,
                    role: response.user.role, 
                },
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
            },
        });
    } catch(error) {
        next(error);
    }
}

export const logout = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        await incrementUserTokenVersion(req.userId);

        res.status(200).json({
            message: "Logout successful",
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{

        if(!req.userId){
            res.status(401).json({
                message: "Authentication required"
            });

            return;
        }

        const user = await getCurrentUser(req.userId!);

        if(!user){
            res.status(404).json({
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt,
            }
        });
        
        
    } catch(error) {
        next(error);
    }
};

export const refresh = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const refreshToken = req.body.refreshToken;
    
        if(!refreshToken){
            res.status(401).json({
                message: "Refresh token required"
            });
    
            return;
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await findUserById(decoded.userId);

        if(!user || user.tokenVersion !== decoded.tokenVersion){
            res.status(401).json({
                message: "Refresh token is no longer valid"
            });

            return;
        }

        const accessToken = generateAccessToken( user._id.toString());

        res.status(200).json({
            accessToken
        });
    } catch(error) {
        if (
            error instanceof Error &&
            error.name === "JsonWebTokenError" ||
            error instanceof Error &&
            error.name === "TokenExpiredError"
        ) {
            res.status(401).json({
                message: "Invalid or expired refresh token",
            });
            return;
        }

        next(error);
    }   
};