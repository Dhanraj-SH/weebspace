import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { User, UserRole } from "../../src/models/userModel.js";
import { generateAccessToken } from "../../src/utils/generateAccessToken.js";
import { generateRefreshToken } from "../../src/utils/generateRefreshToken.js";

export const http = () => request(app);

export const randomId = (): string => new mongoose.Types.ObjectId().toString();

export interface TestUser {
    id: string;
    name: string;
    username: string;
    email: string;
    password: string;
    accessToken: string;
    refreshToken: string;
}

let counter = 0;

export const bearer = (user: { accessToken: string }) => ({ Authorization: `Bearer ${user.accessToken}` });

/** Extracts the refresh token from the Set-Cookie header of a login response. */
export const readRefreshCookie = (headers: Record<string, unknown>): string => {
    const setCookie = (headers["set-cookie"] ?? []) as string[];
    const cookie = setCookie.find((value) => value.startsWith("weebspace_refresh="));

    return cookie ? cookie.split(";")[0]!.slice("weebspace_refresh=".length) : "";
};

// bcrypt cost 12 (used by the real app) takes ~250 ms per hash. Test users use cost 4 so the suite stays fast.
// Register/login through the real API (with the real cost) is covered in auth.test.ts.
const TEST_PASSWORD = "Password123!";
let cachedPasswordHash: string | undefined;
const testPasswordHash = async (): Promise<string> => (cachedPasswordHash ??= await bcrypt.hash(TEST_PASSWORD, 4));

/** Creates a normal user directly in the database and signs real tokens for it. The password is "Password123!". */
export const createUser = async (overrides: Partial<Pick<TestUser, "name" | "username" | "email">> = {}): Promise<TestUser> => {
    counter += 1;
    const suffix = `${counter}_${randomBytes(2).toString("hex")}`;

    const profile = {
        name: `Test User ${counter}`,
        username: `user_${suffix}`,
        email: `user_${suffix}@test.dev`,
        ...overrides,
    };

    const user = await User.create({
        name: profile.name,
        username: profile.username.toLowerCase(),
        email: profile.email.toLowerCase(),
        password: await testPasswordHash(),
    });
    const id = user._id.toString();

    return {
        id,
        name: profile.name,
        username: user.username,
        email: user.email,
        password: TEST_PASSWORD,
        accessToken: generateAccessToken(id, user.tokenVersion),
        refreshToken: generateRefreshToken(id, user.tokenVersion),
    };
};

/** Same as createUser, then sets the role directly in the database (the role is read from the DB on each request). */
const createUserWithRole = async (role: UserRole): Promise<TestUser> => {
    const user = await createUser();
    await User.updateOne({ _id: user.id }, { $set: { role } });
    return user;
};

export const createAdmin = (): Promise<TestUser> => createUserWithRole(UserRole.Admin);
export const createModerator = (): Promise<TestUser> => createUserWithRole(UserRole.Moderator);

export const createManga = async (admin: TestUser, overrides: Record<string, unknown> = {}) => {
    const response = await http()
        .post("/api/v1/manga")
        .set(bearer(admin))
        .send({
            title: `Test Manga ${randomBytes(3).toString("hex")}`,
            description: "A manga used in tests",
            authors: ["Test Author"],
            coverImage: "https://example.com/cover.jpg",
            genres: ["action"],
            ...overrides,
        });

    if (response.status !== 201) {
        throw new Error(`createManga failed (${response.status}) ${JSON.stringify(response.body)}`);
    }

    return response.body.data as { _id: string; title: string; [key: string]: any };
};

export const createChapter = async (admin: TestUser, mangaId: string, chapterNumber: number, pageCount = 3) => {
    const response = await http()
        .post(`/api/v1/manga/${mangaId}/chapters`)
        .set(bearer(admin))
        .send({
            chapterNumber,
            title: `Chapter ${chapterNumber}`,
            pages: Array.from({ length: pageCount }, (_, index) => `https://example.com/m/${mangaId}/c${chapterNumber}/p${index + 1}.jpg`),
        });

    if (response.status !== 201) {
        throw new Error(`createChapter failed (${response.status}) ${JSON.stringify(response.body)}`);
    }

    return response.body.data as { _id: string; chapterNumber: number; [key: string]: any };
};
