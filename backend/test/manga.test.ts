import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Chapter } from "../src/models/chapterModel.js";
import { Comment } from "../src/models/commentModel.js";
import { Library } from "../src/models/libraryModel.js";
import { Manga } from "../src/models/mangaModel.js";
import { Rating } from "../src/models/ratingModel.js";
import { ReadingProgress } from "../src/models/readingProgressModel.js";
import { Review } from "../src/models/reviewModel.js";
import { ReviewLike } from "../src/models/reviewLikeModel.js";
import { bearer, createAdmin, createChapter, createManga, createModerator, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe("POST /manga", () => {
    it("is ADMIN only: 401 without token, 403 for user and moderator", async () => {
        const user = await createUser();
        const moderator = await createModerator();
        const body = { title: "X", description: "Y" };

        expect((await http().post("/api/v1/manga").send(body)).status).toBe(401);
        expect((await http().post("/api/v1/manga").set(bearer(user)).send(body)).status).toBe(403);
        expect((await http().post("/api/v1/manga").set(bearer(moderator)).send(body)).status).toBe(403);
    });

    it("creates a manga with defaults", async () => {
        const admin = await createAdmin();

        const response = await http().post("/api/v1/manga").set(bearer(admin)).send({ title: "One Piece", description: "Pirates" });

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
            title: "One Piece",
            status: "ongoing",
            genres: ["unknown"],
            authors: [],
            artists: [],
            ratingAverage: 0,
            ratingCount: 0,
        });
    });

    it("removes duplicate genres", async () => {
        const admin = await createAdmin();

        const manga = await createManga(admin, { genres: ["action", "comedy", "action"] });

        expect(manga.genres).toEqual(["action", "comedy"]);
    });

    it.each([
        ["missing title", { title: undefined }],
        ["empty title", { title: "" }],
        ["title over 200 characters", { title: "a".repeat(201) }],
        ["missing description", { description: undefined }],
        ["cover that is not a url", { coverImage: "not-a-url" }],
        ["unknown genre", { genres: ["notAGenre"] }],
        ["unknown status", { status: "cancelled" }],
    ])("rejects %s with 400", async (_label, patch) => {
        const admin = await createAdmin();

        const response = await http()
            .post("/api/v1/manga")
            .set(bearer(admin))
            .send({ title: "Valid", description: "Valid", ...patch });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("accepts a long title (up to 200 characters)", async () => {
        const admin = await createAdmin();

        const response = await http().post("/api/v1/manga").set(bearer(admin)).send({ title: "a".repeat(200), description: "d" });

        expect(response.status).toBe(201);
    });
});

describe("GET /manga (list, search, filters, pagination)", () => {
    beforeEach(async () => {
        const admin = await createAdmin();
        await createManga(admin, { title: "Alpha Hero", genres: ["action"], status: "ongoing", authors: ["Oda"] });
        await createManga(admin, { title: "Beta Romance", genres: ["romance"], status: "completed", alternativeTitles: ["Love Story"] });
        await createManga(admin, { title: "Gamma Hero", genres: ["action", "comedy"], status: "completed", artists: ["Toriyama"] });
    });

    it("is public and returns data + pagination meta", async () => {
        const response = await http().get("/api/v1/manga");

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(3);
        expect(response.body.meta.pagination).toMatchObject({ page: 1, limit: 20, total: 3, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
    });

    it("paginates", async () => {
        const first = await http().get("/api/v1/manga?limit=2&page=1&sortBy=title&order=asc");
        const second = await http().get("/api/v1/manga?limit=2&page=2&sortBy=title&order=asc");

        expect(first.body.data.map((m: { title: string }) => m.title)).toEqual(["Alpha Hero", "Beta Romance"]);
        expect(second.body.data.map((m: { title: string }) => m.title)).toEqual(["Gamma Hero"]);
        expect(first.body.meta.pagination).toMatchObject({ total: 3, totalPages: 2, hasNextPage: true });
        expect(second.body.meta.pagination).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
    });

    it("searches title, alternative titles, authors and artists (case-insensitive)", async () => {
        const titles = async (query: string) =>
            (await http().get(`/api/v1/manga?q=${encodeURIComponent(query)}`)).body.data.map((m: { title: string }) => m.title).sort();

        expect(await titles("hero")).toEqual(["Alpha Hero", "Gamma Hero"]);
        expect(await titles("LOVE STORY")).toEqual(["Beta Romance"]);
        expect(await titles("oda")).toEqual(["Alpha Hero"]);
        expect(await titles("toriyama")).toEqual(["Gamma Hero"]);
    });

    it("treats regex characters in the search as plain text", async () => {
        const response = await http().get("/api/v1/manga?q=.*");

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(0);
    });

    it("filters by genre and status, and combines filters", async () => {
        const action = await http().get("/api/v1/manga?genre=action");
        const completed = await http().get("/api/v1/manga?status=completed");
        const both = await http().get("/api/v1/manga?genre=action&status=completed");

        expect(action.body.data).toHaveLength(2);
        expect(completed.body.data).toHaveLength(2);
        expect(both.body.data.map((m: { title: string }) => m.title)).toEqual(["Gamma Hero"]);
    });

    it("sorts by title ascending and descending", async () => {
        const asc = await http().get("/api/v1/manga?sortBy=title&order=asc");
        const desc = await http().get("/api/v1/manga?sortBy=title&order=desc");

        expect(asc.body.data[0].title).toBe("Alpha Hero");
        expect(desc.body.data[0].title).toBe("Gamma Hero");
    });

    it("sorts by reader rating count", async () => {
        await Manga.updateOne({ title: "Alpha Hero" }, { $set: { ratingCount: 2 } });
        await Manga.updateOne({ title: "Beta Romance" }, { $set: { ratingCount: 8 } });
        await Manga.updateOne({ title: "Gamma Hero" }, { $set: { ratingCount: 4 } });

        const response = await http().get("/api/v1/manga?sortBy=ratingCount&order=desc");

        expect(response.status).toBe(200);
        expect(response.body.data.map((manga: { title: string }) => manga.title)).toEqual(["Beta Romance", "Gamma Hero", "Alpha Hero"]);
    });

    it.each([["limit=101"], ["limit=0"], ["page=0"], ["genre=nope"], ["status=nope"], ["sortBy=password"], ["order=sideways"]])(
        "rejects invalid query %s with 400",
        async (query) => {
            expect((await http().get(`/api/v1/manga?${query}`)).status).toBe(400);
        }
    );

    it("the old /manga/search route is gone", async () => {
        const response = await http().get("/api/v1/manga/search?q=hero");

        expect(response.status).toBe(400); // "search" is treated as an (invalid) manga id
    });
});

describe("GET /manga/:mangaId", () => {
    it("returns one manga, 404 for unknown, 400 for malformed id", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin, { title: "Solo" });

        const found = await http().get(`/api/v1/manga/${manga._id}`);
        expect(found.status).toBe(200);
        expect(found.body.data.title).toBe("Solo");

        expect((await http().get(`/api/v1/manga/${randomId()}`)).status).toBe(404);
        expect((await http().get("/api/v1/manga/123")).status).toBe(400);
    });
});

describe("PATCH /manga/:mangaId", () => {
    it("updates fields, ADMIN only", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const denied = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(user)).send({ title: "Hacked" });
        expect(denied.status).toBe(403);

        const updated = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ title: "Renamed", status: "completed" });
        expect(updated.status).toBe(200);
        expect(updated.body.data).toMatchObject({ title: "Renamed", status: "completed" });
    });

    it("returns 404 for an unknown manga and 400 for invalid data", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        expect((await http().patch(`/api/v1/manga/${randomId()}`).set(bearer(admin)).send({ title: "x" })).status).toBe(404);
        expect((await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ status: "bad" })).status).toBe(400);
    });

    it("cannot overwrite the rating counters through the API", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ ratingAverage: 5, ratingCount: 999 });

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ ratingAverage: 0, ratingCount: 0 });
    });
});

describe("DELETE /manga/:mangaId (cascade)", () => {
    it("is ADMIN only and returns 404 for unknown ids", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await http().delete(`/api/v1/manga/${manga._id}`).set(bearer(user))).status).toBe(403);
        expect((await http().delete(`/api/v1/manga/${randomId()}`).set(bearer(admin))).status).toBe(404);
        expect(await Manga.countDocuments({ _id: manga._id })).toBe(1);
    });

    it("deletes the manga AND all chapters, library entries, progress, ratings, reviews, likes and comments", async () => {
        const admin = await createAdmin();
        const reader = await createUser();
        const other = await createUser();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        await http().post("/api/v1/library").set(bearer(reader)).send({ mangaId: manga._id, status: "reading" });
        await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(reader)).send({ chapterId: chapter._id, pageNumber: 2 });
        await http().put(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(reader)).send({ value: 4 });
        const review = await http().post(`/api/v1/manga/${manga._id}/reviews`).set(bearer(reader)).send({ content: "Great" });
        await http().post(`/api/v1/manga/${manga._id}/reviews`).set(bearer(other)).send({ content: "Also great" });
        await http().post(`/api/v1/reviews/${review.body.data._id}/like`).set(bearer(other));
        const comment = await http().post(`/api/v1/manga/${manga._id}/comments`).set(bearer(reader)).send({ content: "Top level" });
        await http().post(`/api/v1/manga/${manga._id}/comments`).set(bearer(other)).send({ content: "Reply", parentCommentId: comment.body.data._id });
        await http().post(`/api/v1/chapters/${chapter._id}/comments`).set(bearer(reader)).send({ content: "On the chapter" });

        // sanity: everything exists first
        expect(await Chapter.countDocuments({ mangaId: manga._id })).toBe(1);
        expect(await Review.countDocuments({ mangaId: manga._id })).toBe(2);
        expect(await ReviewLike.countDocuments()).toBe(1);
        expect(await Comment.countDocuments({ mangaId: manga._id })).toBe(3);

        const response = await http().delete(`/api/v1/manga/${manga._id}`).set(bearer(admin));
        expect(response.status).toBe(200);

        expect(await Manga.countDocuments({ _id: manga._id })).toBe(0);
        expect(await Chapter.countDocuments({ mangaId: manga._id })).toBe(0);
        expect(await Library.countDocuments({ mangaId: manga._id })).toBe(0);
        expect(await ReadingProgress.countDocuments({ mangaId: manga._id })).toBe(0);
        expect(await Rating.countDocuments({ mangaId: manga._id })).toBe(0);
        expect(await Review.countDocuments({ mangaId: manga._id })).toBe(0); // ALL reviews, not just one
        expect(await ReviewLike.countDocuments()).toBe(0);
        expect(await Comment.countDocuments({ mangaId: manga._id })).toBe(0); // ALL comments, not just one
    });

    it("does not touch other manga's data", async () => {
        const admin = await createAdmin();
        const reader = await createUser();
        const doomed = await createManga(admin);
        const safe = await createManga(admin);
        const safeChapter = await createChapter(admin, safe._id, 1);
        await http().post(`/api/v1/manga/${safe._id}/reviews`).set(bearer(reader)).send({ content: "keep me" });
        await http().post(`/api/v1/manga/${safe._id}/comments`).set(bearer(reader)).send({ content: "keep me too" });
        await http().put(`/api/v1/manga/${safe._id}/ratings/me`).set(bearer(reader)).send({ value: 5 });
        await http().put(`/api/v1/reading-progress/${safe._id}`).set(bearer(reader)).send({ chapterId: safeChapter._id, pageNumber: 1 });

        await http().delete(`/api/v1/manga/${doomed._id}`).set(bearer(admin));

        expect(await Chapter.countDocuments({ mangaId: safe._id })).toBe(1);
        expect(await Review.countDocuments({ mangaId: safe._id })).toBe(1);
        expect(await Comment.countDocuments({ mangaId: safe._id })).toBe(1);
        expect(await Rating.countDocuments({ mangaId: safe._id })).toBe(1);
        expect(await ReadingProgress.countDocuments({ mangaId: safe._id })).toBe(1);
    });
});
