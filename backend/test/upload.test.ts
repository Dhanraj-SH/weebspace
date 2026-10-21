import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Chapter } from "../src/models/chapterModel.js";
import { Manga } from "../src/models/mangaModel.js";
import { createUploadUrl, deleteByPrefix, headObject } from "../src/providers/storageProvider.js";
import { bearer, createAdmin, createChapter, createManga, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

const MB = 1024 * 1024;
const COVER_KEY = /^manga\/[0-9a-f]{24}\/cover\/[0-9a-f-]{36}\.webp$/;

const presign = (user: { accessToken: string }, body: Record<string, unknown>) =>
    http().post("/api/v1/uploads/presign").set(bearer(user)).send(body);

describe("POST /uploads/presign", () => {
    it("is ADMIN only: 401 without token, 403 for a normal user", async () => {
        const user = await createUser();
        const body = { purpose: "cover", mangaId: randomId(), contentType: "image/webp", size: 1000 };

        expect((await http().post("/api/v1/uploads/presign").send(body)).status).toBe(401);
        expect((await presign(user, body)).status).toBe(403);
        expect(createUploadUrl).not.toHaveBeenCalled();
    });

    it("returns a presigned upload for a cover, with a unique key under the manga's folder", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await presign(admin, { purpose: "cover", mangaId: manga._id, contentType: "image/webp", size: 123456 });

        expect(response.status).toBe(200);
        const { uploadUrl, key, publicUrl, requiredHeaders } = response.body.data;
        expect(key).toMatch(COVER_KEY);
        expect(key.startsWith(`manga/${manga._id}/cover/`)).toBe(true);
        expect(uploadUrl).toBe(`https://r2.test/upload/${key}?signature=fake`);
        expect(publicUrl).toBe(`https://media.test/${key}`);
        expect(requiredHeaders).toEqual({ "Content-Type": "image/webp" });
        expect(createUploadUrl).toHaveBeenCalledWith(key, "image/webp", 123456);
    });

    it.each([
        ["image/jpeg", "jpg"],
        ["image/png", "png"],
        ["image/webp", "webp"],
    ])("uses the right file extension for %s", async (contentType, extension) => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await presign(admin, { purpose: "cover", mangaId: manga._id, contentType, size: 10 });

        expect(response.body.data.key.endsWith(`.${extension}`)).toBe(true);
    });

    it("gives every call a different key", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const body = { purpose: "cover", mangaId: manga._id, contentType: "image/webp", size: 10 };

        const first = await presign(admin, body);
        const second = await presign(admin, body);

        expect(first.body.data.key).not.toBe(second.body.data.key);
    });

    it("returns a key inside the chapter's folder for a page", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        const response = await presign(admin, { purpose: "page", mangaId: manga._id, chapterId: chapter._id, contentType: "image/png", size: 5000 });

        expect(response.status).toBe(200);
        expect(response.body.data.key.startsWith(`manga/${manga._id}/chapters/${chapter._id}/`)).toBe(true);
        expect(response.body.data.key.endsWith(".png")).toBe(true);
    });

    it("enforces size limits: cover 5 MB, page 10 MB (boundary values)", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);
        const cover = (size: number) => presign(admin, { purpose: "cover", mangaId: manga._id, contentType: "image/webp", size });
        const page = (size: number) => presign(admin, { purpose: "page", mangaId: manga._id, chapterId: chapter._id, contentType: "image/webp", size });

        expect((await cover(5 * MB)).status).toBe(200);
        expect((await cover(5 * MB + 1)).status).toBe(400);
        expect((await page(10 * MB)).status).toBe(200);
        expect((await page(10 * MB + 1)).status).toBe(400);
    });

    it.each([
        ["a content type that is not an allowed image", { contentType: "image/gif" }],
        ["a non-image content type", { contentType: "application/pdf" }],
        ["size 0", { size: 0 }],
        ["a negative size", { size: -5 }],
        ["a fractional size", { size: 10.5 }],
        ["size as text", { size: "100" }],
        ["a missing size", { size: undefined }],
        ["an unknown purpose", { purpose: "avatar" }],
        ["a malformed manga id", { mangaId: "nope" }],
    ])("rejects %s with 400", async (_label, patch) => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await presign(admin, { purpose: "cover", mangaId: manga._id, contentType: "image/webp", size: 1000, ...patch });

        expect(response.status).toBe(400);
        expect(createUploadUrl).not.toHaveBeenCalled();
    });

    it("rejects a page upload without a chapterId with 400", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await presign(admin, { purpose: "page", mangaId: manga._id, contentType: "image/webp", size: 1000 });

        expect(response.status).toBe(400);
    });

    it("returns 404 for an unknown manga or chapter, and 400 for a chapter of another manga", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const other = await createManga(admin);
        const foreignChapter = await createChapter(admin, other._id, 1);
        const base = { contentType: "image/webp", size: 1000 };

        expect((await presign(admin, { ...base, purpose: "cover", mangaId: randomId() })).status).toBe(404);
        expect((await presign(admin, { ...base, purpose: "page", mangaId: manga._id, chapterId: randomId() })).status).toBe(404);

        const mismatch = await presign(admin, { ...base, purpose: "page", mangaId: manga._id, chapterId: foreignChapter._id });
        expect(mismatch.status).toBe(400);
        expect(mismatch.body.error.message).toMatch(/Chapter does not belong to (this )?manga/);
        expect(createUploadUrl).not.toHaveBeenCalled();
    });
});

describe("saving an uploaded cover (PATCH /manga/:id)", () => {
    const uploadCover = async (admin: Awaited<ReturnType<typeof createAdmin>>, mangaId: string) =>
        (await presign(admin, { purpose: "cover", mangaId, contentType: "image/webp", size: 1000 })).body.data.key as string;

    it("stores the KEY but returns a full public URL; the file is verified in storage first", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const key = await uploadCover(admin, manga._id);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ coverImage: key });

        expect(response.status).toBe(200);
        expect(response.body.data.coverImage).toBe(`https://media.test/${key}`);
        expect(headObject).toHaveBeenCalledWith(key);
        expect((await Manga.findById(manga._id))?.coverImage).toBe(key); // the database holds the key

        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data.coverImage).toBe(`https://media.test/${key}`);
        const list = await http().get("/api/v1/manga");
        expect(list.body.data[0].coverImage).toBe(`https://media.test/${key}`);
    });

    it("still accepts an absolute URL, unchanged, without calling storage", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ coverImage: "https://example.com/other.jpg" });

        expect(response.status).toBe(200);
        expect(response.body.data.coverImage).toBe("https://example.com/other.jpg");
        expect(headObject).not.toHaveBeenCalled();
    });

    it("rejects a key whose file was never uploaded (400)", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const key = await uploadCover(admin, manga._id);
        vi.mocked(headObject).mockResolvedValueOnce(null);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ coverImage: key });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Uploaded file not found in storage");
        expect((await Manga.findById(manga._id))?.coverImage).toBe("https://example.com/cover.jpg");
    });

    it("rejects a key that belongs to another manga (400)", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const other = await createManga(admin);
        const foreignKey = await uploadCover(admin, other._id);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ coverImage: foreignKey });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("A file does not belong to this item");
        expect(headObject).not.toHaveBeenCalled();
    });

    it.each([
        ["a path traversal attempt", (id: string) => `manga/${id}/cover/../../other/x.webp`],
        ["a key with a wrong extension", (id: string) => `manga/${id}/cover/abc.exe`],
        ["a key outside the manga folder layout", (id: string) => `secrets/${id}/cover/abc.webp`],
        ["a plain word that is neither a URL nor a key", () => "just-a-string"],
    ])("rejects %s with 400", async (_label, build) => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http().patch(`/api/v1/manga/${manga._id}`).set(bearer(admin)).send({ coverImage: build(manga._id) });

        expect(response.status).toBe(400);
    });

    it("returns 404 for an unknown manga before touching storage", async () => {
        const admin = await createAdmin();
        const someKey = `manga/${randomId()}/cover/${"a".repeat(8)}-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp`;

        const response = await http().patch(`/api/v1/manga/${randomId()}`).set(bearer(admin)).send({ coverImage: someKey });

        expect(response.status).toBe(404);
        expect(headObject).not.toHaveBeenCalled();
    });

    it("creating a manga still needs a URL (a key cannot exist before the manga does)", async () => {
        const admin = await createAdmin();
        const key = `manga/${randomId()}/cover/${"a".repeat(8)}-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp`;

        const response = await http().post("/api/v1/manga").set(bearer(admin)).send({ title: "T", description: "D", coverImage: key });

        expect(response.status).toBe(400);
    });
});

describe("saving uploaded pages (PATCH /chapters/:id)", () => {
    const uploadPage = async (admin: Awaited<ReturnType<typeof createAdmin>>, mangaId: string, chapterId: string) =>
        (await presign(admin, { purpose: "page", mangaId, chapterId, contentType: "image/webp", size: 1000 })).body.data.key as string;

    it("stores keys in order, and the chapter detail returns full URLs in that order", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1, 0);
        const keys = [await uploadPage(admin, manga._id, chapter._id), await uploadPage(admin, manga._id, chapter._id), await uploadPage(admin, manga._id, chapter._id)];

        const updated = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ pages: keys });

        expect(updated.status).toBe(200);
        expect(updated.body.data.pages).toEqual(keys.map((key) => `https://media.test/${key}`));
        expect((await Chapter.findById(chapter._id))?.pages).toEqual(keys);
        expect(headObject).toHaveBeenCalledTimes(3);

        const detail = await http().get(`/api/v1/chapters/${chapter._id}`);
        expect(detail.body.data.pages).toEqual(keys.map((key) => `https://media.test/${key}`));

        const list = await http().get(`/api/v1/manga/${manga._id}/chapters`);
        expect(list.body.data[0]).not.toHaveProperty("pages");
    });

    it("mixes keys and plain URLs, leaving URLs unchanged", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1, 0);
        const key = await uploadPage(admin, manga._id, chapter._id);

        const response = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ pages: ["https://example.com/p1.jpg", key] });

        expect(response.body.data.pages).toEqual(["https://example.com/p1.jpg", `https://media.test/${key}`]);
        expect(headObject).toHaveBeenCalledTimes(1);
    });

    it("reading progress still bounds the page number by the number of stored pages", async () => {
        const admin = await createAdmin();
        const reader = await createUser();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1, 0);
        const keys = [await uploadPage(admin, manga._id, chapter._id), await uploadPage(admin, manga._id, chapter._id)];
        await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ pages: keys });

        const ok = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(reader)).send({ chapterId: chapter._id, pageNumber: 2 });
        const tooFar = await http().put(`/api/v1/reading-progress/${manga._id}`).set(bearer(reader)).send({ chapterId: chapter._id, pageNumber: 3 });

        expect(ok.body.data.completed).toBe(true);
        expect(tooFar.status).toBe(400);
    });

    it("rejects a key of another chapter (400) and a missing file (400); 404 for an unknown chapter", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1, 0);
        const otherChapter = await createChapter(admin, manga._id, 2, 0);
        const foreignKey = await uploadPage(admin, manga._id, otherChapter._id);
        const ownKey = await uploadPage(admin, manga._id, chapter._id);

        const foreign = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ pages: [foreignKey] });
        expect(foreign.status).toBe(400);
        expect(foreign.body.error.message).toBe("A file does not belong to this item");

        vi.mocked(headObject).mockResolvedValueOnce(null);
        const missing = await http().patch(`/api/v1/chapters/${chapter._id}`).set(bearer(admin)).send({ pages: [ownKey] });
        expect(missing.status).toBe(400);

        const unknown = await http().patch(`/api/v1/chapters/${randomId()}`).set(bearer(admin)).send({ pages: [ownKey] });
        expect(unknown.status).toBe(404);
        expect((await Chapter.findById(chapter._id))?.pages).toEqual([]);
    });
});

describe("cleaning up stored files on delete", () => {
    it("deleting a manga removes everything under manga/<id>/", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);

        const response = await http().delete(`/api/v1/manga/${manga._id}`).set(bearer(admin));

        expect(response.status).toBe(200);
        expect(deleteByPrefix).toHaveBeenCalledWith(`manga/${manga._id}/`);
    });

    it("deleting a chapter removes only that chapter's folder", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);

        const response = await http().delete(`/api/v1/chapters/${chapter._id}`).set(bearer(admin));

        expect(response.status).toBe(200);
        expect(deleteByPrefix).toHaveBeenCalledTimes(1);
        expect(deleteByPrefix).toHaveBeenCalledWith(`manga/${manga._id}/chapters/${chapter._id}/`);
    });

    it("a storage failure never makes the delete fail (best effort)", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const chapter = await createChapter(admin, manga._id, 1);
        vi.mocked(deleteByPrefix).mockRejectedValue(new Error("R2 is down"));
        const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const chapterDelete = await http().delete(`/api/v1/chapters/${chapter._id}`).set(bearer(admin));
        const mangaDelete = await http().delete(`/api/v1/manga/${manga._id}`).set(bearer(admin));

        expect(chapterDelete.status).toBe(200);
        expect(mangaDelete.status).toBe(200);
        expect(await Manga.countDocuments({ _id: manga._id })).toBe(0);
        expect(log).toHaveBeenCalled();
    });

    it("does not call storage when the manga does not exist or the user is not allowed", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        await http().delete(`/api/v1/manga/${randomId()}`).set(bearer(admin));
        await http().delete(`/api/v1/manga/${manga._id}`).set(bearer(user));

        expect(deleteByPrefix).not.toHaveBeenCalled();
    });
});

describe("creating a chapter (POST /manga/:id/chapters) only accepts URLs for pages", () => {
    it("rejects a storage key: it cannot be verified or belong to a chapter that does not exist yet", async () => {
        const admin = await createAdmin();
        const manga = await createManga(admin);
        const key = `manga/${manga._id}/chapters/${randomId()}/${"a".repeat(8)}-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp`;

        const response = await http().post(`/api/v1/manga/${manga._id}/chapters`).set(bearer(admin)).send({ chapterNumber: 1, pages: [key] });

        expect(response.status).toBe(400);
    });
});