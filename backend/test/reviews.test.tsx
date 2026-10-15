import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Rating } from "../src/models/ratingModel.js";
import { Review } from "../src/models/reviewModel.js";
import { ReviewLike } from "../src/models/reviewLikeModel.js";
import { bearer, createAdmin, createManga, createModerator, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

const review = (user: { accessToken: string }, mangaId: string, body: Record<string, unknown> = { content: "Loved it" }) =>
    http().post(`/api/v1/manga/${mangaId}/reviews`).set(bearer(user)).send(body);

describe("POST /manga/:mangaId/reviews", () => {
    it("creates a review without a rating", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const response = await review(user, manga._id);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ content: "Loved it", userId: user.id, mangaId: manga._id, likesCount: 0, rating: null });
        expect(response.body.data).not.toHaveProperty("likes");
        expect(await Rating.countDocuments()).toBe(0);
    });

    it("with a rating, writes it through the Rating collection and updates the manga stats", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        const response = await review(user, manga._id, { content: "Great", rating: 5 });

        expect(response.status).toBe(201);
        expect(response.body.data.rating).toBe(5);
        expect(await Rating.countDocuments({ userId: user.id, mangaId: manga._id, value: 5 })).toBe(1);
        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 5, ratingCount: 1 });
    });

    it("allows only ONE review per user per manga (409), but another user and another manga are fine", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const other = await createUser();
        const manga = await createManga(admin);
        const otherManga = await createManga(admin);
        await review(user, manga._id);

        const duplicate = await review(user, manga._id, { content: "Second try" });

        expect(duplicate.status).toBe(409);
        expect(duplicate.body.error.message).toBe("You have already reviewed this manga");
        expect((await review(other, manga._id)).status).toBe(201);
        expect((await review(user, otherManga._id)).status).toBe(201);
        expect(await Review.countDocuments({ userId: user.id, mangaId: manga._id })).toBe(1);
    });

    it.each([
        ["empty content", { content: "" }],
        ["whitespace content", { content: "   " }],
        ["content over 5000 characters", { content: "a".repeat(5001) }],
        ["rating 0", { content: "x", rating: 0 }],
        ["rating 6", { content: "x", rating: 6 }],
        ["rating 3.5", { content: "x", rating: 3.5 }],
    ])("rejects %s with 400", async (_label, body) => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await review(user, manga._id, body)).status).toBe(400);
    });

    it("accepts content of exactly 5000 characters", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await review(user, manga._id, { content: "a".repeat(5000) })).status).toBe(201);
    });

    it("requires authentication and an existing manga", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);

        expect((await http().post(`/api/v1/manga/${manga._id}/reviews`).send({ content: "x" })).status).toBe(401);
        expect((await review(user, randomId())).status).toBe(404);
    });
});

describe("GET reviews", () => {
    it("lists reviews of a manga (public), newest first, with each author's current rating and pagination", async () => {
        const admin = await createAdmin();
        const alice = await createUser();
        const bob = await createUser();
        const manga = await createManga(admin);
        await review(alice, manga._id, { content: "first", rating: 4 });
        await new Promise((resolve) => setTimeout(resolve, 20));
        await review(bob, manga._id, { content: "second" });

        const response = await http().get(`/api/v1/manga/${manga._id}/reviews`);

        expect(response.status).toBe(200);
        expect(response.body.data.map((r: { content: string }) => r.content)).toEqual(["second", "first"]);
        expect(response.body.data[0].rating).toBeNull();
        expect(response.body.data[1].rating).toBe(4);
        expect(response.body.meta.pagination).toMatchObject({ total: 2, totalPages: 1 });

        const paged = await http().get(`/api/v1/manga/${manga._id}/reviews?limit=1&page=2`);
        expect(paged.body.data).toHaveLength(1);
        expect(paged.body.meta.pagination).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
    });

    it("only lists reviews of the requested manga", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const first = await createManga(admin);
        const second = await createManga(admin);
        await review(user, first._id);

        expect((await http().get(`/api/v1/manga/${second._id}/reviews`)).body.data).toHaveLength(0);
        expect((await http().get(`/api/v1/manga/${randomId()}/reviews`)).status).toBe(404);
    });

    it("shows the rating from the Rating collection (single source of truth), even if it changed after the review", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const created = await review(user, manga._id, { content: "x", rating: 2 });

        await http().put(`/api/v1/manga/${manga._id}/ratings/me`).set(bearer(user)).send({ value: 5 });

        const single = await http().get(`/api/v1/reviews/${created.body.data._id}`);
        expect(single.body.data.rating).toBe(5);
    });

    it("GET /reviews/:id returns one review, 404 / 400 for bad ids", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const created = await review(user, manga._id);

        expect((await http().get(`/api/v1/reviews/${created.body.data._id}`)).status).toBe(200);
        expect((await http().get(`/api/v1/reviews/${randomId()}`)).status).toBe(404);
        expect((await http().get("/api/v1/reviews/nope")).status).toBe(400);
    });
});

describe("PATCH /reviews/:reviewId", () => {
    it("lets the author edit the content and the rating", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const created = await review(user, manga._id, { content: "old", rating: 2 });

        const response = await http().patch(`/api/v1/reviews/${created.body.data._id}`).set(bearer(user)).send({ content: "new", rating: 4 });

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ content: "new", rating: 4 });
        const detail = await http().get(`/api/v1/manga/${manga._id}`);
        expect(detail.body.data).toMatchObject({ ratingAverage: 4, ratingCount: 1 });
    });

    it("can update only the rating", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const manga = await createManga(admin);
        const created = await review(user, manga._id, { content: "keep this" });

        const response = await http().patch(`/api/v1/reviews/${created.body.data._id}`).set(bearer(user)).send({ rating: 3 });

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ content: "keep this", rating: 3 });
    });

    it("rejects an empty update, and edits by non-authors (also by moderators and admins)", async () => {
        const admin = await createAdmin();
        const moderator = await createModerator();
        const author = await createUser();
        const stranger = await createUser();
        const manga = await createManga(admin);
        const created = await review(author, manga._id);
        const url = `/api/v1/reviews/${created.body.data._id}`;

        expect((await http().patch(url).set(bearer(author)).send({})).status).toBe(400);
        expect((await http().patch(url).set(bearer(stranger)).send({ content: "hijack" })).status).toBe(403);
        expect((await http().patch(url).set(bearer(moderator)).send({ content: "hijack" })).status).toBe(403);
        expect((await http().patch(url).set(bearer(admin)).send({ content: "hijack" })).status).toBe(403);
        expect((await Review.findById(created.body.data._id))?.content).toBe("Loved it");
    });

    it("requires authentication; 404 for unknown reviews", async () => {
        const user = await createUser();

        expect((await http().patch(`/api/v1/reviews/${randomId()}`).send({ content: "x" })).status).toBe(401);
        expect((await http().patch(`/api/v1/reviews/${randomId()}`).set(bearer(user)).send({ content: "x" })).status).toBe(404);
    });
});

describe("DELETE /reviews/:reviewId", () => {
    it("the author can delete, which also removes its likes but keeps the user's rating", async () => {
        const admin = await createAdmin();
        const author = await createUser();
        const fan = await createUser();
        const manga = await createManga(admin);
        const created = await review(author, manga._id, { content: "x", rating: 4 });
        await http().post(`/api/v1/reviews/${created.body.data._id}/like`).set(bearer(fan));

        const response = await http().delete(`/api/v1/reviews/${created.body.data._id}`).set(bearer(author));

        expect(response.status).toBe(200);
        expect(await Review.countDocuments()).toBe(0);
        expect(await ReviewLike.countDocuments()).toBe(0);
        expect(await Rating.countDocuments({ userId: author.id })).toBe(1);
    });

    it("a user who is not the author gets 403, a moderator and an admin can delete", async () => {
        const admin = await createAdmin();
        const moderator = await createModerator();
        const author = await createUser();
        const stranger = await createUser();
        const manga = await createManga(admin);
        const first = await review(author, manga._id);

        expect((await http().delete(`/api/v1/reviews/${first.body.data._id}`).set(bearer(stranger))).status).toBe(403);
        expect(await Review.countDocuments()).toBe(1);

        expect((await http().delete(`/api/v1/reviews/${first.body.data._id}`).set(bearer(moderator))).status).toBe(200);

        const second = await review(author, manga._id);
        expect((await http().delete(`/api/v1/reviews/${second.body.data._id}`).set(bearer(admin))).status).toBe(200);
        expect(await Review.countDocuments()).toBe(0);
    });

    it("requires authentication; 404 for unknown reviews", async () => {
        const user = await createUser();

        expect((await http().delete(`/api/v1/reviews/${randomId()}`)).status).toBe(401);
        expect((await http().delete(`/api/v1/reviews/${randomId()}`).set(bearer(user))).status).toBe(404);
    });
});

describe("review likes", () => {
    const setup = async () => {
        const admin = await createAdmin();
        const author = await createUser();
        const fan = await createUser();
        const manga = await createManga(admin);
        const created = await review(author, manga._id);
        return { author, fan, reviewId: created.body.data._id as string };
    };

    it("like increments likesCount; liking twice returns 409 and does not double count", async () => {
        const { fan, reviewId } = await setup();

        const first = await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan));
        const second = await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan));

        expect(first.status).toBe(200);
        expect(first.body.data.likesCount).toBe(1);
        expect(second.status).toBe(409);
        expect(second.body.error.message).toBe("You already liked this review");
        expect((await Review.findById(reviewId))?.likesCount).toBe(1);
        expect(await ReviewLike.countDocuments({ reviewId })).toBe(1);
    });

    it("several users can like; the count follows", async () => {
        const { author, fan, reviewId } = await setup();
        const third = await createUser();

        await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan));
        await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(author));
        const last = await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(third));

        expect(last.body.data.likesCount).toBe(3);
    });

    it("unlike decrements; unliking when not liked returns 409; the count never goes below 0", async () => {
        const { fan, reviewId } = await setup();

        expect((await http().delete(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan))).status).toBe(409);

        await http().post(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan));
        const unlike = await http().delete(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan));

        expect(unlike.status).toBe(200);
        expect(unlike.body.data.likesCount).toBe(0);
        expect((await http().delete(`/api/v1/reviews/${reviewId}/like`).set(bearer(fan))).status).toBe(409);
        expect((await Review.findById(reviewId))?.likesCount).toBe(0);
    });

    it("requires authentication; 404 for unknown reviews", async () => {
        const { fan, reviewId } = await setup();

        expect((await http().post(`/api/v1/reviews/${reviewId}/like`)).status).toBe(401);
        expect((await http().post(`/api/v1/reviews/${randomId()}/like`).set(bearer(fan))).status).toBe(404);
        expect((await http().delete(`/api/v1/reviews/${randomId()}/like`).set(bearer(fan))).status).toBe(404);
    });
});
