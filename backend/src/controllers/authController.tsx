import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/authService.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

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
        const {user, token} = await loginUser(response.data);

        res.status(200).json({
            message: "Login successful",
            token,
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

}