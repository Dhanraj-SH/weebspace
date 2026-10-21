import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bearer, createAdmin, createManga, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe("library requires authentication", () => {
    it.each([
        ["get", "/api/v1/library"],
        ["post", "/api/v1/library"],
        ["patch", `/api/v1/library/${"a".repeat(24)}`],
        ["delete", `/api/v1/library/${"a".repeat(24)}`],
    ] as const)("%s %s -> 401", async (method, url) => {
        expect((await http()[method](url)).status).toBe(401);
    });
});

describe("POST /library", () => {
    it("adds a manga with a status", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const response = await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "reading" });

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ mangaId: manga._id, userId: user.id, status: "reading" });
    });

    it("rejects a duplicate with 409", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "reading" });

        const response = await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "dropped" });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe("Manga already exists in your library");
    });

    it("returns 404 for an unknown manga and 400 for invalid bodies", async () => {
        const user = await createUser();

        expect((await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: randomId(), status: "reading" })).status).toBe(404);
        expect((await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: "bad", status: "reading" })).status).toBe(400);
        expect((await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: randomId(), status: "nope" })).status).toBe(400);
        expect((await http().post("/api/v1/library").set(bearer(user)).send({})).status).toBe(400);
    });
});

describe("GET /library", () => {
    it("lists only the logged-in user's entries with manga details", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin, { title: "Shared Title" });
        await http().post("/api/v1/library").set(bearer(alice)).send({ mangaId: manga._id, status: "reading" });
        await http().post("/api/v1/library").set(bearer(bob)).send({ mangaId: manga._id, status: "dropped" });

        const response = await http().get("/api/v1/library").set(bearer(alice));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe("reading");
        expect(response.body.data[0].mangaId).toMatchObject({ title: "Shared Title" });
        expect(response.body.meta.pagination.total).toBe(1);
    });

    it("filters by status and paginates", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const statuses = ["reading", "reading", "completed"];
        for (const status of statuses) {
            const manga = await createManga(admin);
            await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status });
        }

        const reading = await http().get("/api/v1/library?status=reading").set(bearer(user));
        expect(reading.body.data).toHaveLength(2);

        const paged = await http().get("/api/v1/library?limit=2&page=2").set(bearer(user));
        expect(paged.body.data).toHaveLength(1);
        expect(paged.body.meta.pagination).toMatchObject({ total: 3, totalPages: 2, hasPreviousPage: true, hasNextPage: false });

        expect((await http().get("/api/v1/library?status=bogus").set(bearer(user))).status).toBe(400);
    });
});

describe("PATCH /library/:mangaId", () => {
    it("changes the status", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "planToRead" });

        const response = await http().patch(`/api/v1/library/${manga._id}`).set(bearer(user)).send({ status: "completed" });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("completed");
    });

    it("returns 404 when the manga is not in the library, 400 for a bad status", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const missing = await http().patch(`/api/v1/library/${manga._id}`).set(bearer(user)).send({ status: "completed" });
        expect(missing.status).toBe(404);
        expect(missing.body.error.message).toBe("Manga is not in your library");

        await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "reading" });
        expect((await http().patch(`/api/v1/library/${manga._id}`).set(bearer(user)).send({ status: "bogus" })).status).toBe(400);
    });

    it("cannot modify another user's entry", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin);
        await http().post("/api/v1/library").set(bearer(alice)).send({ mangaId: manga._id, status: "reading" });

        const response = await http().patch(`/api/v1/library/${manga._id}`).set(bearer(bob)).send({ status: "dropped" });

        expect(response.status).toBe(404);
        const aliceLibrary = await http().get("/api/v1/library").set(bearer(alice));
        expect(aliceLibrary.body.data[0].status).toBe("reading");
    });
});

describe("DELETE /library/:mangaId", () => {
    it("removes the entry, then returns 404 the second time", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        await http().post("/api/v1/library").set(bearer(user)).send({ mangaId: manga._id, status: "reading" });

        expect((await http().delete(`/api/v1/library/${manga._id}`).set(bearer(user))).status).toBe(200);
        expect((await http().delete(`/api/v1/library/${manga._id}`).set(bearer(user))).status).toBe(404);
        expect((await http().get("/api/v1/library").set(bearer(user))).body.data).toHaveLength(0);
    });

    it("cannot delete another user's entry", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin);
        await http().post("/api/v1/library").set(bearer(alice)).send({ mangaId: manga._id, status: "reading" });

        expect((await http().delete(`/api/v1/library/${manga._id}`).set(bearer(bob))).status).toBe(404);
        expect((await http().get("/api/v1/library").set(bearer(alice))).body.data).toHaveLength(1);
    });
});
