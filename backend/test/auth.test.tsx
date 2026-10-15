import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "../src/models/userModel.js";
import { getGoogleAuthUrl, getGoogleProfile } from "../src/providers/googleAuthProvider.js";
import { bearer, createUser, http, randomId, readRefreshCookie } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

// Never call the real Google in tests
vi.mock("../src/providers/googleAuthProvider.js", () => ({
    getGoogleAuthUrl: vi.fn(),
    getGoogleProfile: vi.fn(),
}));

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

const validRegistration = {
    name: "Test User",
    username: "TestUser_1",
    email: "Test@Example.com",
    password: "Password123!",
};

describe("POST /auth/register", () => {
    it("creates a user, normalises username/email and never returns secrets", async () => {
        const response = await http().post("/api/v1/auth/register").send(validRegistration);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ username: "testuser_1", email: "test@example.com", role: "user" });
        expect(response.body.data).not.toHaveProperty("password");
        expect(response.body.data).not.toHaveProperty("tokenVersion");
        expect(response.body.data).not.toHaveProperty("googleId");

        const stored = await User.findOne({ email: "test@example.com" }).select("+password");
        expect(stored?.password).toBeDefined();
        expect(stored?.password).not.toBe(validRegistration.password); // hashed
    });

    it("rejects a duplicate email with 409", async () => {
        await http().post("/api/v1/auth/register").send(validRegistration);

        const response = await http().post("/api/v1/auth/register").send({ ...validRegistration, username: "other_name" });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe("Email is already registered");
    });

    it("rejects a duplicate username with 409", async () => {
        await http().post("/api/v1/auth/register").send(validRegistration);

        const response = await http().post("/api/v1/auth/register").send({ ...validRegistration, email: "other@example.com" });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe("Username is already taken");
    });

    it.each([
        ["username with a space", { username: "a b" }],
        ["username that is too short", { username: "ab" }],
        ["username with @", { username: "bad@name" }],
        ["invalid email", { email: "not-an-email" }],
        ["short password", { password: "short" }],
        ["empty name", { name: "" }],
    ])("rejects %s with 400", async (_label, patch) => {
        const response = await http().post("/api/v1/auth/register").send({ ...validRegistration, ...patch });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects an empty body with 400", async () => {
        const response = await http().post("/api/v1/auth/register");

        expect(response.status).toBe(400);
    });
});

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await http().post("/api/v1/auth/register").send(validRegistration);
    });

    it("logs in by email and returns an access token + httpOnly refresh cookie", async () => {
        const response = await http().post("/api/v1/auth/login").send({ identifier: "TEST@example.com", password: validRegistration.password });

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toEqual(expect.any(String));
        expect(response.body.data.user).toMatchObject({ email: "test@example.com" });
        expect(response.body.data.user).not.toHaveProperty("password");
        expect(JSON.stringify(response.body)).not.toContain("refreshToken");

        const cookie = (response.headers["set-cookie"] as unknown as string[]).find((value) => value.startsWith("weebspace_refresh="));
        expect(cookie).toBeDefined();
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Path=/api/v1/auth");
    });

    it("logs in by username", async () => {
        const response = await http().post("/api/v1/auth/login").send({ identifier: "testuser_1", password: validRegistration.password });

        expect(response.status).toBe(200);
    });

    it("rejects a wrong password with 401", async () => {
        const response = await http().post("/api/v1/auth/login").send({ identifier: "testuser_1", password: "WrongPassword1" });

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("gives the same error for an unknown user (no user enumeration)", async () => {
        const response = await http().post("/api/v1/auth/login").send({ identifier: "nobody@example.com", password: "Whatever123!" });

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("rejects a missing identifier / password with 400", async () => {
        const response = await http().post("/api/v1/auth/login").send({});

        expect(response.status).toBe(400);
    });

    it("does not allow password login for a Google-only account", async () => {
        await User.create({ name: "G User", username: "guser", email: "g@example.com", googleId: "google-123" });

        const response = await http().post("/api/v1/auth/login").send({ identifier: "g@example.com", password: "Anything123!" });

        expect(response.status).toBe(401);
    });
});

describe("POST /auth/refresh", () => {
    it("issues a new access token from the refresh cookie", async () => {
        const user = await createUser();

        const response = await http().post("/api/v1/auth/refresh").set("Cookie", `weebspace_refresh=${user.refreshToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toEqual(expect.any(String));
    });

    it("also accepts the refresh token in the body (Postman / mobile)", async () => {
        const user = await createUser();

        const response = await http().post("/api/v1/auth/refresh").send({ refreshToken: user.refreshToken });

        expect(response.status).toBe(200);
    });

    it("the new access token works on a protected route", async () => {
        const user = await createUser();
        const refreshed = await http().post("/api/v1/auth/refresh").send({ refreshToken: user.refreshToken });

        const me = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${refreshed.body.data.accessToken}`);

        expect(me.status).toBe(200);
        expect(me.body.data.email).toBe(user.email);
    });

    it("returns 401 when no token is sent", async () => {
        const response = await http().post("/api/v1/auth/refresh");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Refresh token required");
    });

    it("returns 401 for a garbage token", async () => {
        const response = await http().post("/api/v1/auth/refresh").send({ refreshToken: "garbage" });

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Invalid or expired refresh token");
    });

    it("rejects an ACCESS token used as a refresh token (different secrets)", async () => {
        const user = await createUser();

        const response = await http().post("/api/v1/auth/refresh").send({ refreshToken: user.accessToken });

        expect(response.status).toBe(401);
    });
});

describe("GET /auth/me (authenticate middleware)", () => {
    it("returns the current user", async () => {
        const user = await createUser();

        const response = await http().get("/api/v1/auth/me").set(bearer(user));

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ id: user.id, email: user.email, role: "user" });
    });

    it("rejects a missing token, a wrong scheme and a bad token with 401", async () => {
        expect((await http().get("/api/v1/auth/me")).status).toBe(401);
        expect((await http().get("/api/v1/auth/me").set("Authorization", "Token abc")).status).toBe(401);
        expect((await http().get("/api/v1/auth/me").set("Authorization", "Bearer abc")).status).toBe(401);
    });

    it("rejects an expired token", async () => {
        const user = await createUser();
        const expired = jwt.sign({ userId: user.id, tokenVersion: 0 }, process.env.JWT_ACCESS_SECRET!, { algorithm: "HS256", expiresIn: -10 });

        const response = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${expired}`);

        expect(response.status).toBe(401);
    });

    it("rejects a token signed with a different algorithm", async () => {
        const user = await createUser();
        const wrongAlgorithm = jwt.sign({ userId: user.id, tokenVersion: 0 }, process.env.JWT_ACCESS_SECRET!, { algorithm: "HS384" });

        const response = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${wrongAlgorithm}`);

        expect(response.status).toBe(401);
    });

    it("rejects a token signed with the wrong secret", async () => {
        const forged = jwt.sign({ userId: randomId(), tokenVersion: 0 }, "some-other-secret-that-is-long-enough-123", { algorithm: "HS256" });

        const response = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${forged}`);

        expect(response.status).toBe(401);
    });

    it("rejects a token without tokenVersion (old-style token)", async () => {
        const user = await createUser();
        const oldStyle = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET!, { algorithm: "HS256" });

        const response = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${oldStyle}`);

        expect(response.status).toBe(401);
    });

    it("rejects a valid token whose user no longer exists", async () => {
        const user = await createUser();
        await User.deleteOne({ _id: user.id });

        const response = await http().get("/api/v1/auth/me").set(bearer(user));

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Session is no longer valid");
    });
});

describe("POST /auth/logout", () => {
    it("invalidates the refresh token", async () => {
        const user = await createUser();

        const logout = await http().post("/api/v1/auth/logout").set("Cookie", `weebspace_refresh=${user.refreshToken}`);
        expect(logout.status).toBe(200);

        const refresh = await http().post("/api/v1/auth/refresh").send({ refreshToken: user.refreshToken });
        expect(refresh.status).toBe(401);
        expect(refresh.body.error.message).toBe("Refresh token is no longer valid");
    });

    it("invalidates the existing access token immediately", async () => {
        const user = await createUser();
        expect((await http().get("/api/v1/auth/me").set(bearer(user))).status).toBe(200);

        await http().post("/api/v1/auth/logout").send({ refreshToken: user.refreshToken });

        const response = await http().get("/api/v1/auth/me").set(bearer(user));
        expect(response.status).toBe(401);
    });

    it("clears the refresh cookie", async () => {
        const user = await createUser();

        const logout = await http().post("/api/v1/auth/logout").set("Cookie", `weebspace_refresh=${user.refreshToken}`);

        const cookie = (logout.headers["set-cookie"] as unknown as string[]).find((value) => value.startsWith("weebspace_refresh="));
        expect(cookie).toBeDefined();
        expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("succeeds (idempotent) when no token is sent or the token is garbage", async () => {
        expect((await http().post("/api/v1/auth/logout")).status).toBe(200);
        expect((await http().post("/api/v1/auth/logout").send({ refreshToken: "garbage" })).status).toBe(200);
    });

    it("logs the user out everywhere: a second session stops working too", async () => {
        const first = await createUser();
        const secondLogin = await http().post("/api/v1/auth/login").send({ identifier: first.email, password: first.password });
        const secondRefresh = readRefreshCookie(secondLogin.headers);

        await http().post("/api/v1/auth/logout").send({ refreshToken: first.refreshToken });

        const response = await http().post("/api/v1/auth/refresh").send({ refreshToken: secondRefresh });
        expect(response.status).toBe(401);
    });

    it("a fresh login after logout works again", async () => {
        const user = await createUser();
        await http().post("/api/v1/auth/logout").send({ refreshToken: user.refreshToken });

        const login = await http().post("/api/v1/auth/login").send({ identifier: user.email, password: user.password });
        const me = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${login.body.data.accessToken}`);

        expect(login.status).toBe(200);
        expect(me.status).toBe(200);
    });
});

describe("Google login (provider mocked)", () => {
    const googleProfile = { googleId: "google-sub-1", email: "john.doe+tag@gmail.com", name: "John Doe", avatar: "https://example.com/a.png" };
    const withState = (value = "same-state") => `weebspace_oauth_state=${value}`;

    it("GET /auth/google redirects to Google and stores the state in an httpOnly cookie", async () => {
        vi.mocked(getGoogleAuthUrl).mockImplementation((state: string) => `https://accounts.google.test/auth?state=${state}`);

        const response = await http().get("/api/v1/auth/google");

        expect(response.status).toBe(302);
        const cookie = (response.headers["set-cookie"] as unknown as string[]).find((value) => value.startsWith("weebspace_oauth_state="))!;
        const state = cookie.split(";")[0]!.split("=")[1]!;
        expect(state).toHaveLength(64);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Path=/api/v1/auth/google/callback");
        expect(response.headers.location).toBe(`https://accounts.google.test/auth?state=${state}`);
    });

    it("creates a new user, sets the refresh cookie and redirects to the frontend", async () => {
        vi.mocked(getGoogleProfile).mockResolvedValue(googleProfile);

        const response = await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/auth/callback`);
        expect(readRefreshCookie(response.headers)).not.toBe("");

        const user = await User.findOne({ googleId: "google-sub-1" }).select("+password");
        expect(user).not.toBeNull();
        expect(user?.password).toBeUndefined();
        expect(user?.email).toBe("john.doe+tag@gmail.com");
        expect(user?.username).toMatch(/^[a-z0-9_]{3,20}$/);
    });

    it("the cookie from a Google login can be refreshed (regression: tokenVersion in refresh token)", async () => {
        vi.mocked(getGoogleProfile).mockResolvedValue(googleProfile);
        const callback = await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());

        const refresh = await http().post("/api/v1/auth/refresh").set("Cookie", `weebspace_refresh=${readRefreshCookie(callback.headers)}`);

        expect(refresh.status).toBe(200);
        const me = await http().get("/api/v1/auth/me").set("Authorization", `Bearer ${refresh.body.data.accessToken}`);
        expect(me.body.data.email).toBe("john.doe+tag@gmail.com");
    });

    it("logs the same user in again without creating a duplicate", async () => {
        vi.mocked(getGoogleProfile).mockResolvedValue(googleProfile);

        await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());
        const second = await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());

        expect(second.headers.location).toBe(`${process.env.FRONTEND_URL}/auth/callback`);
        expect(await User.countDocuments({ googleId: "google-sub-1" })).toBe(1);
    });

    it("gives a second Google user with the same email prefix a unique, valid username", async () => {
        vi.mocked(getGoogleProfile).mockResolvedValueOnce(googleProfile);
        await http().get("/api/v1/auth/google/callback?code=a&state=same-state").set("Cookie", withState());

        vi.mocked(getGoogleProfile).mockResolvedValueOnce({ ...googleProfile, googleId: "google-sub-2", email: "john.doe@other.com" });
        await http().get("/api/v1/auth/google/callback?code=b&state=same-state").set("Cookie", withState());

        const usernames = (await User.find({}).select("username")).map((user) => user.username);
        expect(new Set(usernames).size).toBe(2);
        for (const username of usernames) expect(username).toMatch(/^[a-z0-9_]{3,20}$/);
    });

    it("redirects with an error when the email already belongs to a password account", async () => {
        await createUser({ email: "john.doe+tag@gmail.com" });
        vi.mocked(getGoogleProfile).mockResolvedValue(googleProfile);

        const response = await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());

        expect(response.status).toBe(302);
        expect(decodeURIComponent(response.headers.location!)).toMatch(/\/login\?error=.*already exists/);
        expect(await User.countDocuments({ googleId: "google-sub-1" })).toBe(0);
    });

    it("redirects to the login page when the state cookie is missing or does not match", async () => {
        const missing = await http().get("/api/v1/auth/google/callback?code=abc&state=xyz");
        const mismatch = await http().get("/api/v1/auth/google/callback?code=abc&state=one").set("Cookie", withState("two"));

        for (const response of [missing, mismatch]) {
            expect(response.status).toBe(302);
            expect(response.headers.location).toMatch(/\/login\?error=/);
        }
        expect(getGoogleProfile).not.toHaveBeenCalled();
    });

    it("redirects (not a 500 JSON page) when Google rejects the code", async () => {
        vi.mocked(getGoogleProfile).mockRejectedValue(new Error("invalid_grant"));

        const response = await http().get("/api/v1/auth/google/callback?code=abc&state=same-state").set("Cookie", withState());

        expect(response.status).toBe(302);
        expect(decodeURIComponent(response.headers.location!)).toContain("Google sign-in failed");
    });
});
