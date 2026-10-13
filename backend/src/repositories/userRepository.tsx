import { User, UserRole, type IUser } from "../models/userModel.js";
import type { AdminUsersQuery, UpdateMyProfileData } from "../validators/userValidator.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { buildPaginationMeta, getSkip } from "../utils/pagination.js";

export const findUserById = async (userId: string): Promise<IUser | null> => {
    return await User.findById(userId);
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    return await User.findOne({ email });
};

export const findUserByGoogleId = async (googleId: string): Promise<IUser | null> => {
    return await User.findOne({ googleId });
};

export const findUserByIdentifierWithPassword = async (identifier: string): Promise<IUser | null> => {
    const normalized = identifier.toLowerCase();

    return await User.findOne({
        $or: [{ email: normalized }, { username: normalized }],
    }).select("+password");
};

export const findUserByUsername = async (username: string): Promise<IUser | null> => {
    return await User.findOne({ username });
};

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
    return await User.create(userData);
};

export const updateUserProfileById = async (userId: string, userData: UpdateMyProfileData): Promise<IUser | null> => {
    const { name, username, avatar } = userData;

    return await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                ...(name !== undefined && { name }),
                ...(username !== undefined && { username }),
                ...(avatar !== undefined && { avatar }),
            },
        },
        { returnDocument: "after", runValidators: true }
    );
};

export const incrementUserTokenVersion = async (userId: string): Promise<void> => {
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
};

export const findUsersPage = async (query: AdminUsersQuery) => {
    const filter: Record<string, unknown> = {};

    if (query.q) {
        const escaped = escapeRegex(query.q);
        filter.$or = [
            { username: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } },
            { name: { $regex: escaped, $options: "i" } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(getSkip(query)).limit(query.limit),
        User.countDocuments(filter),
    ]);

    return { users, meta: buildPaginationMeta(query, total) };
};

export const updateUserRoleById = async (userId: string, role: UserRole): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: { role } },
        { returnDocument: "after", runValidators: true }
    );
};

export const promoteAdminByEmail = async (email: string): Promise<boolean> => {
    const user = await User.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { $set: { role: UserRole.Admin } },
        { returnDocument: "after", runValidators: true }
    );

    return user !== null;
};

export const countAdmins = async (): Promise<number> => {
    return await User.countDocuments({ role: UserRole.Admin });
};
