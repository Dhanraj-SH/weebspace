import { findAllUsers, findUserById, findUserByUsername, updateUserById, updateUserRoleById } from "../repositories/userRepository.js";
import { AppError } from "../utils/appError.js";
import type { UpdateMyProfileData, UpdateUserRoleData } from "../validators/userValidator.js";

export const getUserById = async(userId: string) => {
    return await findUserById(userId);
};

export const updateProfileById = async (userId: string, userData: UpdateMyProfileData): Promise<any> => {
    if (userData.username) {
        const existingUser = await findUserByUsername(userData.username);

        if ( existingUser && existingUser._id.toString() !== userId) {
            throw new AppError("Username already exists", 409);
        }
    }
    return await updateUserById(userId, userData);
};

export const getAllUsersService = async() => {
    return await findAllUsers();
};

export const updateUserRole = async (userId: string, role: UpdateUserRoleData) => {
    const user = await findUserById(userId);

    if(!user){
        throw new AppError("User Not Found", 404);
    }

    return await updateUserRoleById(userId, role);
}