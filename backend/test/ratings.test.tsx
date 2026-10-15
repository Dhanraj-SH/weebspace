import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Rating } from "../src/models/ratingModel.js";
import { bearer, createAdmin, createManga, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

const rate = (user: { accessToken: string }, mangaId: string, value: unknown) =>
    http().put(`/api/v1/manga/${mangaId}/ratings/me`).set(bearer(user)).send({ value });

describe("GET /manga/:mangaId/ratings (public summary)", () => {
    it("returns zeros for a manga without ratings", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http().get(`/api/v1/manga/${manga._id}/ratings`);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({ average: 0, count: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } });
    });

    it("returns average, count and distribution", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        await rate(await createUser(), manga._id, 5);
        await rate(await createUser(), manga._id, 4);
        await rate(await createUser(), manga._id, 4);

        const response = await http().get(`/api/v1/manga/${manga._id}/ratings`);

        expect(response.body.data.count).toBe(3);
        expect(response.body.data.average).toBeCloseTo(4.33, 2);
        expect(response.body.data.distribution).toEqual({ "1": 0, "2": 0, "3": 0, "4": 2, "5": 1 });
    });

    it("returns 404 for an unknown manga and 400 for a malformed id", async () => {
        expect((await http().get(`/api/v1/manga/${randomId()}/ratings`)).status).toBe(404);
        expect((await http().get("/api/v1/manga/abc/ratings")).status).toBe(400);
    });
});

describe("PUT /manga/:mangaId/ratings/me", () => {
    it("creates a rating and syncs manga.ratingAverage / ratingCount", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const response = await rate(user, manga._id, 4);

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ value: 4, userId: user.id, mangaId: manga._id });

        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 4, ratingCount: 1 });
    });

    it("is idempotent and updates instead of duplicating (one rating per user)", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        await rate(user, manga._id, 2);
        await rate(user, manga._id, 2);
        const changed = await rate(user, manga._id, 5);

        expect(changed.body.data.value).toBe(5);
        expect(await Rating.countDocuments({ userId: user.id, mangaId: manga._id })).toBe(1);
        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 5, ratingCount: 1 });
    });

    it("averages across users and rounds to 2 decimals", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        await rate(await createUser(), manga._id, 5);
        await rate(await createUser(), manga._id, 4);
        await rate(await createUser(), manga._id, 4);

        const detail = await http().get(`/api/v1/manga/${manga._id}`);

        expect(detail.body.data.ratingCount).toBe(3);
        expect(detail.body.data.ratingAverage).toBe(4.33);
    });

    it.each([[0], [6], [-1], [2.5], ["5"], [null]])("rejects value %s with 400", async (value) => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await rate(user, manga._id, value)).status).toBe(400);
    });

    it("requires authentication and an existing manga", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await http().put(`/api/v1/manga/${manga._id}/ratings/me`).send({ value: 3 })).status).toBe(401);
        expect((await rate(user, randomId(), 3)).status).toBe(404);
    });

    it("the old POST /ratings route no longer exists", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const response = await http().post(`/api/v1/manga/${manga._id}/ratings`).set(bearer(user)).send({ value: 3 });

        expect(response.status).toBe(404);
    });
});

describe("GET /manga/:mangaId/ratings/me", () => {
    it("returns my rating, or 404 when I have not rated", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await http().get(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(user))).status).toBe(404);

        await rate(user, manga._id, 3);
        const mine = await http().get(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(user));

        expect(mine.status).toBe(200);
        expect(mine.body.data.value).toBe(3);
    });

    it("never returns another user's rating", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin);
        await rate(alice, manga._id, 5);

        expect((await http().get(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(bob))).status).toBe(404);
    });

    it("requires authentication", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        expect((await http().get(`/api/v1/manga/${manga._id}/ratings/me`)).status).toBe(401);
    });
});

describe("DELETE /manga/:mangaId/ratings/me", () => {
    it("removes my rating and recomputes the manga stats", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin);
        await rate(alice, manga._id, 5);
        await rate(bob, manga._id, 3);

        const response = await http().delete(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(alice));

        expect(response.status).toBe(200);
        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 3, ratingCount: 1 });
    });

    it("resets the stats to 0 when the last rating is removed", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        await rate(user, manga._id, 5);

        await http().delete(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(user));

        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 0, ratingCount: 0 });
    });

    it("returns 404 when I have no rating", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await http().delete(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(user))).status).toBe(404);
    });
});
