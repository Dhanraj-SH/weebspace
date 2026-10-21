import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chapterPrefix, buildCoverKey, buildPageKey, isStorageKey, mangaPrefix } from "../src/utils/storageKeys.js";
import { resolveMediaUrl } from "../src/utils/mediaUrl.js";

const MANGA = "507f1f77bcf86cd799439011";
const CHAPTER = "507f1f77bcf86cd799439012";

describe("storage keys", () => {
    it("builds cover and page keys under the right prefixes", () => {
        expect(buildCoverKey(MANGA, "image/webp").startsWith(`${mangaPrefix(MANGA)}cover/`)).toBe(true);
        expect(buildPageKey(MANGA, CHAPTER, "image/jpeg").startsWith(chapterPrefix(MANGA, CHAPTER))).toBe(true);
        expect(chapterPrefix(MANGA, CHAPTER).startsWith(mangaPrefix(MANGA))).toBe(true);
    });

    it("every built key is a valid storage key", () => {
        expect(isStorageKey(buildCoverKey(MANGA, "image/png"))).toBe(true);
        expect(isStorageKey(buildPageKey(MANGA, CHAPTER, "image/webp"))).toBe(true);
    });

    it.each([
        "",
        "https://example.com/a.jpg",
        `manga/${MANGA}/cover/../x.webp`,
        `manga/${MANGA}/cover/a.gif`,
        `manga/${MANGA}/other/a.webp`,
        `manga/short/cover/a.webp`,
        `../manga/${MANGA}/cover/a.webp`,
        `manga/${MANGA}/cover/a b.webp`,
    ])("rejects %j", (value) => {
        expect(isStorageKey(value)).toBe(false);
    });
});

describe("resolveMediaUrl (R2_PUBLIC_URL is https://media.test in tests)", () => {
    it("leaves absolute URLs unchanged", () => {
        expect(resolveMediaUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
        expect(resolveMediaUrl("http://example.com/a.jpg")).toBe("http://example.com/a.jpg");
    });

    it("turns a key into a public URL", () => {
        expect(resolveMediaUrl(`manga/${MANGA}/cover/a.webp`)).toBe(`https://media.test/manga/${MANGA}/cover/a.webp`);
    });
});

// ---- the REAL provider (the global mock is switched off here), with a fake R2 client ----
describe("storageProvider (real implementation)", () => {
    const send = vi.fn();

    const loadProvider = async () => {
        vi.resetModules();
        vi.doUnmock("../src/providers/storageProvider.js");
        vi.doMock("../src/config/r2.js", () => ({ getR2: () => ({ client: { send }, bucket: "weebspace-media" }) }));
        return await import("../src/providers/storageProvider.js");
    };

    beforeEach(() => send.mockReset());

    it("headObject returns metadata, null for a missing object, and rethrows other errors", async () => {
        const { headObject } = await loadProvider();

        send.mockResolvedValueOnce({ ContentType: "image/webp", ContentLength: 42 });
        expect(await headObject("k")).toEqual({ contentType: "image/webp", size: 42 });

        send.mockRejectedValueOnce(Object.assign(new Error("nf"), { name: "NotFound" }));
        expect(await headObject("k")).toBeNull();

        send.mockRejectedValueOnce(Object.assign(new Error("nf"), { $metadata: { httpStatusCode: 404 } }));
        expect(await headObject("k")).toBeNull();

        send.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "AccessDenied", $metadata: { httpStatusCode: 403 } }));
        await expect(headObject("k")).rejects.toThrow("boom");
    });

    it("deleteByPrefix lists every page of results and deletes in batches", async () => {
        const { deleteByPrefix } = await loadProvider();
        send
            .mockResolvedValueOnce({ Contents: [{ Key: "a" }, { Key: "b" }], IsTruncated: true, NextContinuationToken: "t1" })
            .mockResolvedValueOnce({}) // delete batch 1
            .mockResolvedValueOnce({ Contents: [{ Key: "c" }], IsTruncated: false })
            .mockResolvedValueOnce({}); // delete batch 2

        await deleteByPrefix("manga/x/");

        const calls = send.mock.calls.map(([command]) => command);
        expect(calls).toHaveLength(4);
        expect(calls[0].input).toMatchObject({ Bucket: "weebspace-media", Prefix: "manga/x/" });
        expect(calls[1].input.Delete.Objects).toEqual([{ Key: "a" }, { Key: "b" }]);
        expect(calls[2].input).toMatchObject({ ContinuationToken: "t1" });
        expect(calls[3].input.Delete.Objects).toEqual([{ Key: "c" }]);
    });

    it("deleteByPrefix does not send a delete when nothing matches", async () => {
        const { deleteByPrefix } = await loadProvider();
        send.mockResolvedValueOnce({ IsTruncated: false });

        await deleteByPrefix("manga/empty/");

        expect(send).toHaveBeenCalledTimes(1);
    });

    it("deleteObject sends one DeleteObject for the key", async () => {
        const { deleteObject } = await loadProvider();
        send.mockResolvedValueOnce({});

        await deleteObject("manga/x/cover/a.webp");

        expect(send.mock.calls[0]![0].input).toMatchObject({ Bucket: "weebspace-media", Key: "manga/x/cover/a.webp" });
    });
});

// ---- real S3 client + real presigner, fake credentials (signing is offline). env is mocked, so .env cannot interfere ----
describe("presigned upload URL (real signing, fake credentials)", () => {
    const loadRealProvider = async (env: Record<string, string | undefined>) => {
        vi.resetModules();
        vi.doUnmock("../src/providers/storageProvider.js");
        vi.doUnmock("../src/config/r2.js");
        vi.doMock("../src/config/env.js", () => ({ env }));
        return await import("../src/providers/storageProvider.js");
    };

    afterEach(() => {
        vi.doUnmock("../src/config/env.js");
    });

    it("signs content-type and content-length, expires in 5 minutes and has no checksum parameters", async () => {
        const { createUploadUrl } = await loadRealProvider({
            R2_ACCESS_KEY_ID: "AKIDEXAMPLE",
            R2_SECRET_ACCESS_KEY: "secretexample",
            R2_BUCKET_NAME: "weebspace-media",
            R2_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
        });

        const url = new URL(await createUploadUrl("manga/x/cover/a.webp", "image/webp", 12345));

        expect(url.host.endsWith("abc123.r2.cloudflarestorage.com")).toBe(true);
        expect(url.pathname.endsWith("manga/x/cover/a.webp")).toBe(true);
        expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
        expect(url.searchParams.get("X-Amz-SignedHeaders")!.split(";").sort()).toEqual(["content-length", "content-type", "host"]);
        expect([...url.searchParams.keys()].filter((name) => /checksum/i.test(name))).toEqual([]);
    });

    it("fails with a clear error when R2 is not configured (lazy: only on first use)", async () => {
        const { createUploadUrl } = await loadRealProvider({});

        await expect(createUploadUrl("k", "image/webp", 1)).rejects.toThrow("Cloudflare R2 is not configured");
    });
});