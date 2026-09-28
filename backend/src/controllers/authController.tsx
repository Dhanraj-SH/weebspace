import type { Request, Response } from "express";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/authValidators.js";

export const register = async(req: Request, res: Response): Promise<void> => {
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

        res.status(200).json({
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
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};