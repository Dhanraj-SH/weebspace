import type { IUser } from "../models/userModel.js";

export const toPublicUser = (user: IUser) => ({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    createdAt: user.createdAt,
});

export const toOwnUser = (user: IUser) => ({
    ...toPublicUser(user),
    email: user.email,
    role: user.role,
});