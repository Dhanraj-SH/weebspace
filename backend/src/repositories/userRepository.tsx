import { User, UserRole, type IUser } from "../models/userModel.js";
import type { UpdateMyProfileData, UpdateUserRoleData } from "../validators/userValidator.js";

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

export const incrementUserTokenVersion = async( userId: string): Promise<void> => {
    await User.updateOne(
        { _id: userId},
        { $inc: {tokenVersion: 1}}
    );
};

export const findAllUsers = async(): Promise<IUser[]> => {
    return await User.find().select("-password  -tokenVersion").sort({ createdAt: -1 });
};

export const updateUserRoleById = async(userId: string, role: UpdateUserRoleData): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(
        userId,{ 
            $set: { role }
        },{
            returnDocument: "after",
            runValidators: true,
            projection: { password: 0, tokenVersion: 0 }
        }
    );
};