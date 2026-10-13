import { z } from "zod";
import { usernameSchema } from "./common.js";

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    username: usernameSchema,
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(50),
});

export type RegisterUserData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    identifier: z.string().trim().toLowerCase().min(2),
    password: z.string().min(1).max(50),
});

export type LoginUserData = z.infer<typeof loginSchema>;
