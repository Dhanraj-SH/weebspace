import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Chapter } from "../src/models/chapterModel.js";
import { Comment } from "../src/models/commentModel.js";
import { ReadingProgress } from "../src/models/readingProgressModel.js";
import { bearer, createAdmin, createChapter, createManga, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe("POST /manga/:mangaId/chapters", () => {
    it("is ADMIN only", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const body = { chapterNumber: 1 };

        expect((await http().post(`/api/v1/manga/${manga._id}/chapters`).send(body)).status).toBe(401);
        expect((await http().post(`/api/v1/manga/${manga._id}/chapters`).set(bearer(user)).send(body)).status).toBe(403);
    });

    it("creates a chapter with pages", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http()
            .post(`/api/v1/manga/${manga._id}/chapters`)
            .set(bearer(admin))
            .send({ chapterNumber: 1, title: "Start", pages: ["https://example.com/1.jpg", "https://example.com/2.jpg"] });

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ chapterNumber: 1, title: "Start", mangaId: manga._id });
        expect(response.body.data.pages).toHaveLength(2);
    });

    it("allows chapter 0 (prologue) and decimal chapter numbers", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        expect((await http().post(`/api/v1/manga/${manga._id}/chapters`).set(bearer(admin)).send({ chapterNumber: 0 })).status).toBe(201);
        expect((await http().post(`/api/v1/manga/${manga._id}/chapters`).set(bearer(admin)).send({ chapterNumber: 10.5 })).status).toBe(201);
    });

    it("rejects a duplicate chapter number in the same manga with 409, but allows it in another manga", async () => {
        const admin = await createAdmin();
        const first = await createManga(admin);
        const second = await createManga(admin);
        await createChapter(admin, first._id, 1);

        const duplicate = await http().post(`/api/v1/manga/${first._id}/chapters`).set(bearer(admin)).send({ chapterNumber: 1 });
        const otherManga = await http().post(`/api/v1/manga/${second._id}/chapters`).set(bearer(admin)).send({ chapterNumber: 1 });

        expect(duplicate.status).toBe(409);
        expect(duplicate.body.error.message).toBe("Chapter number already exists in this manga");
        expect(otherManga.status).toBe(201);
    });

    it.each([
        ["negative chapter number", { chapterNumber: -1 }],
        ["missing chapter number", {}],
        ["chapter number as text", { chapterNumber: "one" }],
        ["a page that is not a url", { chapterNumber: 1, pages: ["nope"] }],
    ])("rejects %s with 400", async (_label, body) => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        expect((await http().post(`/api/v1/manga/${manga._id}/chapters`).set(bearer(admin)).send(body)).status).toBe(400);
    });

    it("returns 404 for an unknown manga and 400 for a malformed id", async () => {
        const admin = await createAdmin();

        expect((await http().post(`/api/v1/manga/${randomId()}/chapters`).set(bearer(admin)).send({ chapterNumber: 1 })).status).toBe(404);
        expect((await http().post("/api/v1/manga/abc/chapters").set(bearer(admin)).send({ chapterNumber: 1 })).status).toBe(400);
    });
});

describe("GET /manga/:mangaId/chapters", () => {
    it("is public, sorted by chapter number and does not include the pages array", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        await createChapter(admin, manga._id, 3);
        await createChapter(admin, manga._id, 1);
        await createChapter(admin, manga._id, 2);

        const response = await http().get(`/api/v1/manga/${manga._id}/chapters`);

        expect(response.status).toBe(200);
        expect(response.body.data.map((c: { chapterNumber: number }) => c.chapterNumber)).toEqual([1, 2, 3]);
        for (const chapter of response.body.data) expect(chapter).not.toHaveProperty("pages");
    });

    it("only returns chapters of that manga", async () => {
        const admin = await createAdmin();
        const first = await createManga(admin);
        const second = await createManga(admin);
        await createChapter(admin, first._id, 1);
        await createChapter(admin, second._id, 1);
        await createChapter(admin, second._id, 2);

        const response = await http().get(`/api/v1/manga/${second._id}/chapters`);

        expect(response.body.data).toHaveLength(2);
    });

    it("returns 404 for an unknown manga", async () => {
        expect((await http().get(`/api/v1/manga/${randomId()}/chapters`)).status).toBe(404);
    });
});

describe("GET /chapters/:chapterId", () => {
    it("returns the pages and the previous / next chapter ids", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const one = await createChapter(admin, manga._id, 1, 2);
        const two = await createChapter(admin, manga._id, 2, 2);
        const three = await createChapter(admin, manga._id, 3, 2);

        const middle = await http().get(`/api/v1/chapters/${two._id}`);
        expect(middle.status).toBe(200);
        expect(middle.body.data.pages).toHaveLength(2);
        expect(middle.body.data.prevChapterId).toBe(one._id);
        expect(middle.body.data.nextChapterId).toBe(three._id);

        const first = await http().get(`/api/v1/chapters/${one._id}`);
        expect(first.body.data.prevChapterId).toBeNull();
        expect(first.body.data.nextChapterId).toBe(two._id);

        const last = await http().get(`/api/v1/chapters/${three._id}`);
        expect(last.body.data.prevChapterId).toBe(two._id);
        expect(last.body.data.nextChapterId).toBeNull();
    });

    it("navigation ignores chapters of other manga", async () => {
        const admin = await createAdmin();
        const first = await createManga(admin);
        const second = await createManga(admin);
        const mine = await createChapter(admin, first._id, 1);
        await createChapter(admin, second._id, 2);

        const response = await http().get(`/api/v1/chapters/${mine._id}`);

        expect(response.body.data.nextChapterId).toBeNull();
    });

    it("returns 404 for unknown and 400 for malformed ids", async () => {
        expect((await http().get(`/api/v1/chapters/${randomId()}`)).status).toBe(404);
        expect((await http().get("/api/v1/chapters/xyz")).status).toBe(400);
    });
});

describe("POST /chapters/:chapterId/views", () => {
    it("increments the chapter view count and rejects unknown or malformed ids", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        const first = await http().post(`/api/v1/chapters/${chapter._id}/views`);
        const second = await http().post(`/api/v1/chapters/${chapter._id}/views`);

        expect(first.status).toBe(200);
        expect(first.body.data.viewCount).toBe(1);
        expect(second.body.data.viewCount).toBe(2);
        expect((await Chapter.findById(chapter._id))?.viewCount).toBe(2);
        expect((await http().post(`/api/v1/chapters/${randomId()}/views`)).status).toBe(404);
        expect((await http().post("/api/v1/chapters/123/views")).status).toBe(400);
    });
});

describe("PATCH /chapters/:chapterId", () => {
    it("updates a chapter (ADMIN only)", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        expect((await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(user)).send({ title: "x" })).status).toBe(403);

        const response = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ title: "Renamed", chapterNumber: 5 });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ title: "Renamed", chapterNumber: 5 });
    });

    it("cannot move a chapter to another manga", async () => {
        const admin = await createAdmin();
        const first = await createManga(admin);
        const second = await createManga(admin);
        const chapter = await createChapter(admin, first._id, 1);

        const response = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ mangaId: second._id });

        expect(response.status).toBe(200);
        expect(response.body.data.mangaId).toBe(first._id);
    });

    it("rejects renaming to an existing chapter number with 409", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        await createChapter(admin, manga._id, 1);
        const two = await createChapter(admin, manga._id, 2);

        const response = await http().patch(`/api/v1/chapters/${two._id}`).set(bearer(admin)).send({ chapterNumber: 1 });

        expect(response.status).toBe(409);
    });

    it("returns 404 for an unknown chapter and 400 for invalid data", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        expect((await http().patch(`/api/v1/chapters/${randomId()}`).set(bearer(admin)).send({ title: "x" })).status).toBe(404);
        expect((await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ chapterNumber: -5 })).status).toBe(400);
    });
});

describe("DELETE /chapters/:chapterId (cascade)", () => {
    it("is ADMIN only and 404 for unknown ids", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        expect((await http().delete(`/api/v1/chapters/${chapter._id}`).set(bearer(user))).status).toBe(403);
        expect((await http().delete(`/api/v1/chapters/${randomId()}`).set(bearer(admin))).status).toBe(404);
    });

    it("removes the chapter plus its reading progress and chapter comments (replies too), and keeps everything else", async () => {
        const admin = await createAdmin();
        const reader = await createUser();
        const manga = await createManga(admin);
        const doomed = await createChapter(admin, manga._id, 1);
        const kept = await createChapter(admin, manga._id, 2);

        const doomedComment = await http().post(`/api/v1/chapters/${doomed._id}/comments`).set(bearer(reader)).send({ content: "on doomed" });
        await http().post(`/api/v1/chapters/${doomed._id}/comments`).set(bearer(admin)).send({ content: "reply", parentCommentId: doomedComment.body.data._id });
        await http().post(`/api/v1/chapters/${kept._id}/comments`).set(bearer(reader)).send({ content: "on kept" });
        await http().post(`/api/v1/manga/${manga._id}/comments`).set(bearer(reader)).send({ content: "on manga" });
        await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(reader)).send({ chapterId: doomed._id, pageNumber: 1 });

        const response = await http().delete(`/api/v1/chapters/${doomed._id}`).set(bearer(admin));

        expect(response.status).toBe(200);
        expect((await http().get(`/api/v1/chapters/${doomed._id}`)).status).toBe(404);
        expect(await ReadingProgress.countDocuments({ chapterId: doomed._id })).toBe(0);
        expect(await Comment.countDocuments({ chapterId: doomed._id })).toBe(0);
        expect(await Comment.countDocuments({ chapterId: kept._id })).toBe(1);
        expect(await Comment.countDocuments({ mangaId: manga._id, chapterId: null })).toBe(1);
        expect((await http().get(`/api/v1/chapters/${kept._id}`)).status).toBe(200);
    });
});
