import { User, type IUser } from "../models/userModel.js";

export const findUserById = async (userId: string): Promise<IUser | null> => {
    return User.findById( userId );
}

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    return User.findOne({ email });
};

export const findUserByEmailWithPassword = async (email : string): Promise<IUser | null> => {
    return User.findOne({ email }).select("+password");
};

export const findUserByIdentifierWithPassword = async (identifier: string): Promise<IUser | null> => {
    return User.findOne({
        $or: [
            {email: identifier.toLowerCase()},
            {username: identifier.toLowerCase()}
        ]
    }).select("+password");
}

export const findUserByUsername = async (username: string): Promise<IUser | null> => {
    return User.findOne({ username });
};

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
    return User.create(userData);
};