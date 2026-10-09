import mongoose, { Document, Schema } from "mongoose";

export enum UserRole {
    User = "user",
    Moderator = "moderator",
    Admin = "admin",
}

export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    password?: string;
    avatar?: string;
    googleId?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            select: false,
        },

        avatar: {
            type: String,
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.User,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>("User", userSchema);