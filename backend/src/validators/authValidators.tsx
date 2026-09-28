import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    username: z.string().trim().min(3).max(20),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(50),
});

export type RegisterUserData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    identifier: z.string().trim().min(2),
    password: z.string().min(8).max(50),
});

export type LoginUserData = z.infer<typeof loginSchema>;