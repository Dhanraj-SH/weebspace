import { findUserById, updateUserById } from "../repositories/userRepository.js";
import type { UpdateMyProfileData } from "../validators/userValidator.js";

export const getUserById = async(userId: string) => {
    return await findUserById(userId);
};

export const updateProfileById = async (userId: string, userData: UpdateMyProfileData): Promise<any> => {
    return await updateUserById(userId, userData);
}