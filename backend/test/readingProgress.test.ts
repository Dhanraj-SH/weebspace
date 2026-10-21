import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ReadingProgress } from "../src/models/readingProgressModel.js";
import { bearer, createAdmin, createChapter, createManga, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

const setup = async (pageCount = 3) => {
    const admin = await createAdmin();
    const user = await createUser();
    const manga = await createManga(admin);
    const chapter = await createChapter(admin, manga._id, 1, pageCount);
    return { admin, user, manga, chapter };
};

describe("reading progress requires authentication", () => {
    it.each([["get", "/api/v1/reading-progress"], ["get", `/api/v1/reading-progress/${"a".repeat(24)}`], ["put", `/api/v1/reading-progress/${"a".repeat(24)}`], ["delete", `/api/v1/reading-progress/${"a".repeat(24)}`]] as const)(
        "%s %s -> 401",
        async (method, url) => {
            expect((await http()[method](url)).status).toBe(401);
        }
    );
});

describe("GET /reading-progress/:mangaId", () => {
    it("returns 200 with data null when the user has not started", async () => {
        const { user, manga } = await setup();

        const response = await http().get(`/api/v1/reading-progress/${manga._id}`).set(bearer(user));

        expect(response.status).toBe(200);
        expect(response.body.data).toBeNull();
    });

    it("returns 404 for an unknown manga", async () => {
        const { user } = await setup();

        expect((await http().get(`/api/v1/reading-progress/${randomId()}`).set(bearer(user))).status).toBe(404);
    });
});

describe("PUT /reading-progress/:mangaId", () => {
    it("saves progress, and saving again updates the same record (upsert)", async () => {
        const { user, manga, chapter } = await setup();

        const first = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 1 });
        const second = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 2 });

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(second.body.data).toMatchObject({ pageNumber: 2, completed: false });
        expect(await ReadingProgress.countDocuments({ userId: user.id, mangaId: manga._id })).toBe(1);

        const read = await http().get(`/api/v1/reading-progress/${manga._id}`).set(bearer(user));
        expect(read.body.data).toMatchObject({ chapterId: chapter._id, pageNumber: 2 });
    });

    it("sets completed=true only on the last page, and back to false when going back", async () => {
        const { user, manga, chapter } = await setup(3);

        const last = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 3 });
        expect(last.body.data.completed).toBe(true);

        const back = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 2 });
        expect(back.body.data.completed).toBe(false);
    });

    it("rejects a page beyond the chapter's page count with 400", async () => {
        const { user, manga, chapter } = await setup(3);

        const response = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 4 });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Page number must be between 1 and 3");
    });

    it.each([[0], [-1], [1.5], ["2"]])("rejects pageNumber %s with 400", async (pageNumber) => {
        const { user, manga, chapter } = await setup();

        const response = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber });

        expect(response.status).toBe(400);
    });

    it("rejects a chapter that belongs to another manga with 400", async () => {
        const { admin, user, manga } = await setup();
        const otherManga = await createManga(admin);
        const foreignChapter = await createChapter(admin, otherManga._id, 1);

        const response = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: foreignChapter._id, pageNumber: 1 });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Chapter does not belong to this manga");
    });

    it("returns 404 for an unknown manga or chapter", async () => {
        const { user, manga, chapter } = await setup();

        expect((await http().put(`/api/v1/reading-progress/${randomId()}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 1 })).status).toBe(404);
        expect((await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: randomId(), pageNumber: 1 })).status).toBe(404);
    });

    it("accepts uppercase ids (case-insensitive comparison)", async () => {
        const { user, manga, chapter } = await setup();

        const response = await http()
            .put(`/api/v1/reading-progress/${manga._id.toUpperCase()}`)
            .set(bearer(user))
            .send({ chapterId: chapter._id.toUpperCase(), pageNumber: 1 });

        expect(response.status).toBe(200);
    });

    it("keeps progress of different users separate", async () => {
        const { user, manga, chapter } = await setup();
        const other = await createUser();
        await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 3 });

        const read = await http().get(`/api/v1/reading-progress/${manga._id}`).set(bearer(other));

        expect(read.body.data).toBeNull();
    });
});

describe("GET /reading-progress (continue reading)", () => {
    it("lists the most recently read manga first, with manga and chapter info", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const older = await createManga(admin, { title: "Older" });
        const newer = await createManga(admin, { title: "Newer" });
        const olderChapter = await createChapter(admin, older._id, 1);
        const newerChapter = await createChapter(admin, newer._id, 4);
        await http().put(`/api/v1/reading-progress/${older._id}`).set(bearer(user)).send({ chapterId: olderChapter._id, pageNumber: 1 });
        await new Promise((resolve) => setTimeout(resolve, 20));
        await http().put(`/api/v1/reading-progress/${newer._id}`).set(bearer(user)).send({ chapterId: newerChapter._id, pageNumber: 2 });

        const response = await http().get("/api/v1/reading-progress").set(bearer(user));

        expect(response.status).toBe(200);
        expect(response.body.data.map((entry: { mangaId: { title: string } }) => entry.mangaId.title)).toEqual(["Newer", "Older"]);
        expect(response.body.data[0].chapterId).toMatchObject({ chapterNumber: 4 });
        expect(response.body.meta.pagination.total).toBe(2);
    });

    it("only lists the logged-in user's progress and paginates", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const other = await createUser();
        for (let i = 1; i <= 3; i++) {
            const manga = await createManga(admin);
            const chapter = await createChapter(admin, manga._id, 1);
            await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 1 });
        }

        expect((await http().get("/api/v1/reading-progress").set(bearer(other))).body.data).toHaveLength(0);

        const page = await http().get("/api/v1/reading-progress?limit=2").set(bearer(user));
        expect(page.body.data).toHaveLength(2);
        expect(page.body.meta.pagination).toMatchObject({ total: 3, hasNextPage: true });
    });
});

describe("DELETE /reading-progress/:mangaId", () => {
    it("deletes progress, then returns 404", async () => {
        const { user, manga, chapter } = await setup();
        await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(user)).send({ chapterId: chapter._id, pageNumber: 1 });

        expect((await http().delete(`/api/v1/reading-progress/${manga._id}`).set(bearer(user))).status).toBe(200);
        expect((await http().delete(`/api/v1/reading-progress/${manga._id}`).set(bearer(user))).status).toBe(404);
        expect((await http().get(`/api/v1/reading-progress/${manga._id}`).set(bearer(user))).body.data).toBeNull();
    });
});
