import { z } from 'zod';
import { UserRole } from '../models/userModel.js';

export const userIdSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).max(50).optional(),
    username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    avatar: z.string().trim().optional(),
});

export type UpdateMyProfileData = z.infer<typeof updateProfileSchema>;

export const updateUserRoleSchema = z.object({
    role: z.enum(UserRole)
});

export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;