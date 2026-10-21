import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bearer, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe("GET /users/me", () => {
    it("returns the private account fields for the logged-in user", async () => {
        const user = await createUser();

        const response = await http().get("/api/v1/users/me").set(bearer(user));

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ id: user.id, email: user.email, username: user.username, role: "user" });
        expect(response.body.data).not.toHaveProperty("password");
        expect(response.body.data).not.toHaveProperty("tokenVersion");
    });

    it("requires authentication", async () => {
        expect((await http().get("/api/v1/users/me")).status).toBe(401);
    });
});

describe("PATCH /users/me", () => {
    it("updates name and username (username is lowercased)", async () => {
        const user = await createUser();

        const response = await http().patch("/api/v1/users/me").set(bearer(user)).send({ name: "New Name", username: "New_Name" });

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ name: "New Name", username: "new_name" });
    });

    it("rejects a username that is already taken with 409", async () => {
        const first = await createUser();
        const second = await createUser();

        const response = await http().patch("/api/v1/users/me").set(bearer(second)).send({ username: first.username });

        expect(response.status).toBe(409);
    });

    it("allows keeping your own username", async () => {
        const user = await createUser();

        const response = await http().patch("/api/v1/users/me").set(bearer(user)).send({ username: user.username });

        expect(response.status).toBe(200);
    });

    it("rejects an invalid username and an invalid avatar url with 400", async () => {
        const user = await createUser();

        expect((await http().patch("/api/v1/users/me").set(bearer(user)).send({ username: "bad name!" })).status).toBe(400);
        expect((await http().patch("/api/v1/users/me").set(bearer(user)).send({ avatar: "not a url" })).status).toBe(400);
    });

    it("cannot change role, email or password through this endpoint", async () => {
        const user = await createUser();

        const response = await http().patch("/api/v1/users/me").set(bearer(user)).send({ role: "admin", email: "hacker@evil.dev", name: "Still Me" });

        expect(response.status).toBe(200);
        expect(response.body.data.role).toBe("user");
        expect(response.body.data.email).toBe(user.email);
    });
});

describe("GET /users/:userId (public profile)", () => {
    it("returns only public fields of another user", async () => {
        const viewer = await createUser();
        const other = await createUser();

        const response = await http().get(`/api/v1/users/${other.id}`).set(bearer(viewer));

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ id: other.id, username: other.username });
        for (const secret of ["email", "role", "password", "tokenVersion", "googleId"]) {
            expect(response.body.data).not.toHaveProperty(secret);
        }
    });

    it("works with an UPPERCASE id", async () => {
        const viewer = await createUser();
        const other = await createUser();

        const response = await http().get(`/api/v1/users/${other.id.toUpperCase()}`).set(bearer(viewer));

        expect(response.status).toBe(200);
    });

    it("returns 404 for an unknown user, 400 for a malformed id, 401 without a token", async () => {
        const viewer = await createUser();

        expect((await http().get(`/api/v1/users/${randomId()}`).set(bearer(viewer))).status).toBe(404);
        expect((await http().get("/api/v1/users/not-an-id").set(bearer(viewer))).status).toBe(400);
        expect((await http().get(`/api/v1/users/${viewer.id}`)).status).toBe(401);
    });
});

describe("removed routes", () => {
    it("PATCH /users/:userId no longer exists", async () => {
        const user = await createUser();

        const response = await http().patch(`/api/v1/users/${user.id}`).set(bearer(user)).send({ name: "x" });

        expect(response.status).toBe(404);
    });
});
