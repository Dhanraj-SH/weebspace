import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../src/models/userModel.js";
import { bearer, createAdmin, createModerator, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe("admin access control", () => {
    it("returns 401 without a token, 403 for a normal user and for a moderator", async () => {
        const user = await createUser();
        const moderator = await createModerator();

        expect((await http().get("/api/v1/admin/users")).status).toBe(401);
        expect((await http().get("/api/v1/admin/users").set(bearer(user))).status).toBe(403);
        expect((await http().get("/api/v1/admin/users").set(bearer(moderator))).status).toBe(403);
    });

    it("manga/chapter write routes are not duplicated under /admin", async () => {
        const admin = await createAdmin();

        const response = await http().post("/api/v1/admin/manga").set(bearer(admin)).send({ title: "x" });

        expect(response.status).toBe(404);
    });
});

describe("GET /admin/users", () => {
    it("lists users with pagination and never exposes secrets", async () => {
        const admin = await createAdmin();
        await createUser();
        await createUser();

        const response = await http().get("/api/v1/admin/users?limit=2&page=1").set(bearer(admin));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true, hasPreviousPage: false });
        for (const entry of response.body.data) {
            expect(entry).not.toHaveProperty("password");
            expect(entry).not.toHaveProperty("tokenVersion");
            expect(entry).not.toHaveProperty("googleId");
        }
    });

    it("searches by username / email / name (case-insensitive, regex-safe)", async () => {
        const admin = await createAdmin();
        const target = await createUser({ username: "findme_please", name: "Zed Special" });
        await createUser();

        const byUsername = await http().get("/api/v1/admin/users?q=FINDME").set(bearer(admin));
        expect(byUsername.body.data.map((u: { id: string }) => u.id)).toEqual([target.id]);

        const byName = await http().get("/api/v1/admin/users?q=special").set(bearer(admin));
        expect(byName.body.data).toHaveLength(1);

        const regexChars = await http().get("/api/v1/admin/users?q=.*").set(bearer(admin));
        expect(regexChars.status).toBe(200);
        expect(regexChars.body.data).toHaveLength(0);
    });

    it("rejects limit above 100", async () => {
        const admin = await createAdmin();

        expect((await http().get("/api/v1/admin/users?limit=101").set(bearer(admin))).status).toBe(400);
    });
});

describe("PATCH /admin/users/:userId (change role)", () => {
    it("promotes a user to moderator and the new role takes effect immediately", async () => {
        const admin = await createAdmin();
        const user = await createUser();

        const response = await http().patch(`/api/v1/admin/users/${user.id}`).set(bearer(admin)).send({ role: "moderator" });

        expect(response.status).toBe(200);
        expect(response.body.data.role).toBe("moderator");
        expect((await User.findById(user.id))?.role).toBe("moderator");
    });

    it("an admin cannot demote themselves", async () => {
        const admin = await createAdmin();

        const response = await http().patch(`/api/v1/admin/users/${admin.id}`).set(bearer(admin)).send({ role: "user" });

        expect(response.status).toBe(403);
        expect((await User.findById(admin.id))?.role).toBe("admin");
    });

    it("an admin can demote another admin when more than one admin exists", async () => {
        const admin = await createAdmin();
        const otherAdmin = await createAdmin();

        const response = await http().patch(`/api/v1/admin/users/${otherAdmin.id}`).set(bearer(admin)).send({ role: "user" });

        expect(response.status).toBe(200);
    });

    it("rejects an invalid role with 400, an unknown user with 404, a bad id with 400", async () => {
        const admin = await createAdmin();
        const user = await createUser();

        expect((await http().patch(`/api/v1/admin/users/${user.id}`).set(bearer(admin)).send({ role: "superuser" })).status).toBe(400);
        expect((await http().patch(`/api/v1/admin/users/${randomId()}`).set(bearer(admin)).send({ role: "user" })).status).toBe(404);
        expect((await http().patch("/api/v1/admin/users/abc").set(bearer(admin)).send({ role: "user" })).status).toBe(400);
    });

    it("a normal user cannot change roles", async () => {
        const user = await createUser();
        const other = await createUser();

        const response = await http().patch(`/api/v1/admin/users/${other.id}`).set(bearer(user)).send({ role: "admin" });

        expect(response.status).toBe(403);
    });
});
