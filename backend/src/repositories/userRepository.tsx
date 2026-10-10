import { User, type IUser } from "../models/userModel.js";
import type { UpdateMyProfileData } from "../validators/userValidator.js";

export const findUserById = async (userId: string): Promise<IUser | null> => {
    return await User.findById( userId );
}

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    return await User.findOne({ email });
};

export const findUserByGoogleId = async (googleId: string): Promise<IUser | null> => {
    return await User.findOne({ googleId });
}

export const findUserByEmailWithPassword = async (email : string): Promise<IUser | null> => {
    return await User.findOne({ email }).select("+password");
};

export const findUserByIdentifierWithPassword = async (identifier: string): Promise<IUser | null> => {
    return await User.findOne({
        $or: [
            {email: identifier.toLowerCase()},
            {username: identifier.toLowerCase()}
        ]
    }).select("+password");
}

export const findUserByUsername = async (username: string): Promise<IUser | null> => {
    return await User.findOne({ username });
};

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
    return await User.create(userData);
};

export const updateUserById = async(userId: string, userData: UpdateMyProfileData): Promise<IUser | null> => {
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
        {
            returnDocument: "after",
            runValidators: true
        }
    );
};