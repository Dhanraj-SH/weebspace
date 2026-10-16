import { countAdmins, findUserById, findUserByUsername, findUsersPage, updateUserProfileById, updateUserRoleById } from "../repositories/userRepository.js";
import { UserRole } from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import type { AdminUsersQuery, UpdateMyProfileData } from "../validators/userValidator.js";

export const getUserProfile = async (userId: string) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};

export const updateProfile = async (userId: string, userData: UpdateMyProfileData) => {
    if (userData.username) {
        const existingUser = await findUserByUsername(userData.username);

        if (existingUser && existingUser._id.toString() !== userId) {
            throw new AppError("Username already exists", 409);
        }
    }

    const user = await updateUserProfileById(userId, userData);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};

export const listUsers = async (query: AdminUsersQuery) => {
    return await findUsersPage(query);
};

export const changeUserRole = async (actorId: string, targetUserId: string, newRole: UserRole) => {
    const targetUser = await findUserById(targetUserId);

    if (!targetUser) {
        throw new AppError("User not found", 404);
    }

    if (actorId === targetUserId && newRole !== UserRole.Admin) {
        throw new AppError("You cannot demote yourself", 403);
    }

    if (targetUser.role === UserRole.Admin && newRole !== UserRole.Admin && (await countAdmins()) <= 1) {
        throw new AppError("Cannot remove the last admin", 409);
    }

    const user = await updateUserRoleById(targetUserId, newRole);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};
