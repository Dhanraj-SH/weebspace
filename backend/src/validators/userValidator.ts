import { z } from "zod";
import { UserRole } from "../models/userModel.js";
import { objectIdSchema, paginationSchema, usernameSchema } from "./common.js";

export const userIdSchema = z.object({ userId: objectIdSchema });

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).max(50).optional(),
    username: usernameSchema.optional(),
    avatar: z.url().optional(),
});

export type UpdateMyProfileData = z.infer<typeof updateProfileSchema>;

export const updateUserRoleSchema = z.object({
    role: z.enum(UserRole),
});

export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;

export const adminUsersQuerySchema = paginationSchema.extend({
    q: z.string().trim().max(100).optional(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;