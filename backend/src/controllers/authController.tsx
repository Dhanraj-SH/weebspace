import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, getCurrentUser } from "../services/authService.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { verifyRefreshToken } from "../utils/verifyRefreshToken.js";
import { generateAccessToken } from "../utils/generateAccessToken.js" 

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

export const logout = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

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

        const accessToken = generateAccessToken(
            decoded.userId
        );

        res.status(200).json({
            accessToken
        });
    } catch(error) {
        next(error);
    }   
};