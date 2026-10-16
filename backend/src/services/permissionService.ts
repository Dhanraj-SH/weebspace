import { UserRole } from "../models/userModel.js";
import { findUserById } from "../repositories/userRepository.js";

export const hasModeratorRights = async (userId: string): Promise<boolean> => {
    const user = await findUserById(userId);

    return user !== null && (user.role === UserRole.Moderator || user.role === UserRole.Admin);
};
