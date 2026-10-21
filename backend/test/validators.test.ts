import { describe, expect, it } from "vitest";
import { objectIdSchema, paginationSchema, usernameSchema } from "../src/validators/common.js";
import { createMangaSchema, listMangaQuerySchema } from "../src/validators/mangaValidators.js";
import { updateReadingProgressSchema } from "../src/validators/readingProgressValidators.js";
import { updateReviewSchema } from "../src/validators/reviewValidators.js";

describe("objectIdSchema", () => {
    it("accepts 24 hex characters and normalises to lowercase", () => {
        expect(objectIdSchema.parse("507F1F77BCF86CD799439011")).toBe("507f1f77bcf86cd799439011");
    });

    it.each(["", "123", "z".repeat(24), "507f1f77bcf86cd79943901", "507f1f77bcf86cd7994390111"])("rejects %j", (value) => {
        expect(objectIdSchema.safeParse(value).success).toBe(false);
    });
});

describe("usernameSchema", () => {
    it("lowercases and trims", () => {
        expect(usernameSchema.parse("  Cool_User1 ")).toBe("cool_user1");
    });

    it.each(["ab", "a".repeat(21), "has space", "bad@char", "dash-name", "ünïcode", ""])("rejects %j", (value) => {
        expect(usernameSchema.safeParse(value).success).toBe(false);
    });

    it("accepts the boundary lengths 3 and 20", () => {
        expect(usernameSchema.safeParse("abc").success).toBe(true);
        expect(usernameSchema.safeParse("a".repeat(20)).success).toBe(true);
    });
});

describe("paginationSchema", () => {
    it("applies defaults and coerces numeric strings", () => {
        expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
        expect(paginationSchema.parse({ page: "3", limit: "50" })).toEqual({ page: 3, limit: 50 });
    });

    it.each([{ page: "0" }, { page: "-1" }, { page: "1.5" }, { limit: "0" }, { limit: "101" }, { limit: "abc" }])("rejects %j", (query) => {
        expect(paginationSchema.safeParse(query).success).toBe(false);
    });
});

describe("createMangaSchema", () => {
    it("applies defaults", () => {
        expect(createMangaSchema.parse({ title: "T", description: "D" })).toMatchObject({
            genres: ["unknown"],
            status: "ongoing",
            authors: [],
            artists: [],
            alternativeTitles: [],
        });
    });

    it("de-duplicates genres and trims the title", () => {
        const parsed = createMangaSchema.parse({ title: "  Title  ", description: "D", genres: ["action", "action", "comedy"] });

        expect(parsed.title).toBe("Title");
        expect(parsed.genres).toEqual(["action", "comedy"]);
    });

    it("strips unknown fields such as ratingAverage", () => {
        const parsed = createMangaSchema.parse({ title: "T", description: "D", ratingAverage: 5, ratingCount: 10 });

        expect(parsed).not.toHaveProperty("ratingAverage");
        expect(parsed).not.toHaveProperty("ratingCount");
    });
});

describe("listMangaQuerySchema", () => {
    it("has sensible defaults", () => {
        expect(listMangaQuerySchema.parse({})).toMatchObject({ page: 1, limit: 20, sortBy: "createdAt", order: "desc" });
    });
});

describe("updateReadingProgressSchema", () => {
    it("requires an integer page >= 1", () => {
        const chapterId = "507f1f77bcf86cd799439011";

        expect(updateReadingProgressSchema.safeParse({ chapterId, pageNumber: 1 }).success).toBe(true);
        expect(updateReadingProgressSchema.safeParse({ chapterId, pageNumber: 0 }).success).toBe(false);
        expect(updateReadingProgressSchema.safeParse({ chapterId, pageNumber: 1.5 }).success).toBe(false);
    });
});

describe("updateReviewSchema", () => {
    it("needs content or rating", () => {
        expect(updateReviewSchema.safeParse({}).success).toBe(false);
        expect(updateReviewSchema.safeParse({ rating: 3 }).success).toBe(true);
        expect(updateReviewSchema.safeParse({ content: "x" }).success).toBe(true);
    });
});
