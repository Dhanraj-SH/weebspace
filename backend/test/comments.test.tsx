import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Comment } from "../src/models/commentModel.js";
import { bearer, createAdmin, createChapter, createManga, createModerator, createUser, http, randomId } from "./helpers/api.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/db.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

type Authed = { accessToken: string };

const commentOnManga = (user: Authed, mangaId: string, body: Record<string, unknown> = { content: "Nice manga" }) =>
    http().post(`/api/v1/manga/${mangaId}/comments`).set(bearer(user)).send(body);

const commentOnChapter = (user: Authed, chapterId: string, body: Record<string, unknown> = { content: "Nice chapter" }) =>
    http().post(`/api/v1/chapters/${chapterId}/comments`).set(bearer(user)).send(body);

const setup = async () => {
    const admin = await createAdmin();
    const alice = await createUser();
    const bob = await createUser();
    const manga = await createManga(admin);
    const chapter = await createChapter(admin, manga._id, 1);
    return { admin, alice, bob, manga, chapter };
};

describe("creating comments", () => {
    it("creates a manga-level comment", async () => {
        const { alice, manga } = await setup();

        const response = await commentOnManga(alice, manga._id);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ content: "Nice manga", userId: alice.id, mangaId: manga._id });
        expect(response.body.data.chapterId).toBeUndefined();
    });

    it("creates a chapter-level comment that also carries the mangaId", async () => {
        const { alice, manga, chapter } = await setup();

        const response = await commentOnChapter(alice, chapter._id);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ chapterId: chapter._id, mangaId: manga._id });
    });

    it.each([
        ["empty content", { content: "" }],
        ["whitespace content", { content: "   " }],
        ["content over 500 characters", { content: "a".repeat(501) }],
        ["malformed parentCommentId", { content: "x", parentCommentId: "nope" }],
    ])("rejects %s with 400", async (_label, body) => {
        const { alice, manga } = await setup();

        expect((await commentOnManga(alice, manga._id, body)).status).toBe(400);
    });

    it("requires authentication; 404 for unknown manga / chapter; 400 for malformed ids", async () => {
        const { alice } = await setup();

        expect((await http().post(`/api/v1/manga/${randomId()}/comments`).send({ content: "x" })).status).toBe(401);
        expect((await commentOnManga(alice, randomId())).status).toBe(404);
        expect((await commentOnChapter(alice, randomId())).status).toBe(404);
        expect((await commentOnManga(alice, "abc")).status).toBe(400);
    });
});

describe("replies", () => {
    it("allows a reply to a top-level comment", async () => {
        const { alice, bob, manga } = await setup();
        const parent = await commentOnManga(alice, manga._id);

        const reply = await commentOnManga(bob, manga._id, { content: "I agree!", parentCommentId: parent.body.data._id });

        expect(reply.status).toBe(201);
        expect(reply.body.data.parentCommentId).toBe(parent.body.data._id);
    });

    it("rejects a reply to a comment that does not exist (404)", async () => {
        const { alice, manga } = await setup();

        const reply = await commentOnManga(alice, manga._id, { content: "x", parentCommentId: randomId() });

        expect(reply.status).toBe(404);
        expect(reply.body.error.message).toBe("Parent comment not found");
    });

    it("rejects a reply whose parent belongs to a different manga (400)", async () => {
        const { admin, alice, manga } = await setup();
        const otherManga = await createManga(admin);
        const parent = await commentOnManga(alice, manga._id);

        const reply = await commentOnManga(alice, otherManga._id, { content: "x", parentCommentId: parent.body.data._id });

        expect(reply.status).toBe(400);
        expect(reply.body.error.message).toBe("Parent comment belongs to a different manga");
    });

    it("rejects a reply across levels: manga comment -> chapter reply, and chapter comment -> manga reply (400)", async () => {
        const { alice, manga, chapter } = await setup();
        const mangaComment = await commentOnManga(alice, manga._id);
        const chapterComment = await commentOnChapter(alice, chapter._id);

        const toChapter = await commentOnChapter(alice, chapter._id, { content: "x", parentCommentId: mangaComment.body.data._id });
        const toManga = await commentOnManga(alice, manga._id, { content: "x", parentCommentId: chapterComment.body.data._id });

        expect(toChapter.status).toBe(400);
        expect(toManga.status).toBe(400);
    });

    it("rejects a reply to another chapter's comment (400)", async () => {
        const { admin, alice, manga, chapter } = await setup();
        const otherChapter = await createChapter(admin, manga._id, 2);
        const parent = await commentOnChapter(alice, chapter._id);

        const reply = await commentOnChapter(alice, otherChapter._id, { content: "x", parentCommentId: parent.body.data._id });

        expect(reply.status).toBe(400);
        expect(reply.body.error.message).toBe("Parent comment belongs to a different chapter");
    });

    it("rejects a reply to a reply (one level deep only)", async () => {
        const { alice, bob, manga } = await setup();
        const parent = await commentOnManga(alice, manga._id);
        const reply = await commentOnManga(bob, manga._id, { content: "reply", parentCommentId: parent.body.data._id });

        const nested = await commentOnManga(alice, manga._id, { content: "nested", parentCommentId: reply.body.data._id });

        expect(nested.status).toBe(400);
        expect(nested.body.error.message).toBe("Replies can only be one level deep");
    });
});

describe("listing comments", () => {
    it("GET /manga/:id/comments is public, returns only manga-level top-level comments with replies grouped", async () => {
        const { alice, bob, manga, chapter } = await setup();
        const top = await commentOnManga(alice, manga._id, { content: "top" });
        await commentOnManga(bob, manga._id, { content: "reply 1", parentCommentId: top.body.data._id });
        await commentOnManga(alice, manga._id, { content: "reply 2", parentCommentId: top.body.data._id });
        await commentOnChapter(alice, chapter._id, { content: "chapter comment" }); // must NOT appear

        const response = await http().get(`/api/v1/manga/${manga._id}/comments`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].content).toBe("top");
        expect(response.body.data[0].replies.map((r: { content: string }) => r.content)).toEqual(["reply 1", "reply 2"]);
        expect(response.body.meta.pagination.total).toBe(1);
    });

    it("GET /chapters/:id/comments returns only that chapter's comments", async () => {
        const { admin, alice, manga, chapter } = await setup();
        const otherChapter = await createChapter(admin, manga._id, 2);
        await commentOnChapter(alice, chapter._id, { content: "mine" });
        await commentOnChapter(alice, otherChapter._id, { content: "other chapter" });
        await commentOnManga(alice, manga._id, { content: "manga level" });

        const response = await http().get(`/api/v1/chapters/${chapter._id}/comments`);

        expect(response.body.data.map((c: { content: string }) => c.content)).toEqual(["mine"]);
        expect(response.body.data[0].replies).toEqual([]);
    });

    it("paginates top-level comments, newest first", async () => {
        const { alice, manga } = await setup();
        for (const content of ["one", "two", "three"]) {
            await commentOnManga(alice, manga._id, { content });
            await new Promise((resolve) => setTimeout(resolve, 15));
        }

        const first = await http().get(`/api/v1/manga/${manga._id}/comments?limit=2&page=1`);
        const second = await http().get(`/api/v1/manga/${manga._id}/comments?limit=2&page=2`);

        expect(first.body.data.map((c: { content: string }) => c.content)).toEqual(["three", "two"]);
        expect(second.body.data.map((c: { content: string }) => c.content)).toEqual(["one"]);
        expect(first.body.meta.pagination).toMatchObject({ total: 3, totalPages: 2, hasNextPage: true });
    });

    it("returns 404 for an unknown manga / chapter and 400 for bad pagination", async () => {
        const { manga } = await setup();

        expect((await http().get(`/api/v1/manga/${randomId()}/comments`)).status).toBe(404);
        expect((await http().get(`/api/v1/chapters/${randomId()}/comments`)).status).toBe(404);
        expect((await http().get(`/api/v1/manga/${manga._id}/comments?limit=500`)).status).toBe(400);
    });
});

describe("PATCH /comments/:commentId", () => {
    it("lets the author edit", async () => {
        const { alice, manga } = await setup();
        const created = await commentOnManga(alice, manga._id);

        const response = await http().patch(`/api/v1/comments/${created.body.data._id}`).set(bearer(alice)).send({ content: "edited" });

        expect(response.status).toBe(200);
        expect(response.body.data.content).toBe("edited");
    });

    it("rejects edits by other users, moderators and admins with 403", async () => {
        const { admin, alice, bob, manga } = await setup();
        const moderator = await createModerator();
        const created = await commentOnManga(alice, manga._id);
        const url = `/api/v1/comments/${created.body.data._id}`;

        for (const other of [bob, moderator, admin]) {
            expect((await http().patch(url).set(bearer(other)).send({ content: "hijack" })).status).toBe(403);
        }
        expect((await Comment.findById(created.body.data._id))?.content).toBe("Nice manga");
    });

    it("validates input and returns 404 for unknown comments; requires authentication", async () => {
        const { alice, manga } = await setup();
        const created = await commentOnManga(alice, manga._id);

        expect((await http().patch(`/api/v1/comments/${created.body.data._id}`).set(bearer(alice)).send({ content: "" })).status).toBe(400);
        expect((await http().patch(`/api/v1/comments/${randomId()}`).set(bearer(alice)).send({ content: "x" })).status).toBe(404);
        expect((await http().patch(`/api/v1/comments/${created.body.data._id}`).send({ content: "x" })).status).toBe(401);
    });
});

describe("DELETE /comments/:commentId", () => {
    it("the author deletes their own comment", async () => {
        const { alice, manga } = await setup();
        const created = await commentOnManga(alice, manga._id);

        const response = await http().delete(`/api/v1/comments/${created.body.data._id}`).set(bearer(alice));

        expect(response.status).toBe(200);
        expect(await Comment.countDocuments()).toBe(0);
    });

    it("deleting a parent comment CASCADES to all its replies (they cannot be edited afterwards)", async () => {
        const { alice, bob, manga } = await setup();
        const parent = await commentOnManga(alice, manga._id, { content: "parent" });
        const replyOne = await commentOnManga(bob, manga._id, { content: "reply 1", parentCommentId: parent.body.data._id });
        await commentOnManga(alice, manga._id, { content: "reply 2", parentCommentId: parent.body.data._id });
        await commentOnManga(alice, manga._id, { content: "unrelated" });

        const response = await http().delete(`/api/v1/comments/${parent.body.data._id}`).set(bearer(alice));

        expect(response.status).toBe(200);
        expect(await Comment.countDocuments({ parentCommentId: parent.body.data._id })).toBe(0);
        expect(await Comment.findById(parent.body.data._id)).toBeNull();
        expect(await Comment.countDocuments()).toBe(1); // only the unrelated comment is left

        const edit = await http().patch(`/api/v1/comments/${replyOne.body.data._id}`).set(bearer(bob)).send({ content: "too late" });
        expect(edit.status).toBe(404);
    });

    it("cascade also works for chapter comments", async () => {
        const { alice, bob, chapter } = await setup();
        const parent = await commentOnChapter(alice, chapter._id);
        await commentOnChapter(bob, chapter._id, { content: "reply", parentCommentId: parent.body.data._id });

        await http().delete(`/api/v1/comments/${parent.body.data._id}`).set(bearer(alice));

        expect(await Comment.countDocuments()).toBe(0);
    });

    it("deleting a reply removes only that reply and keeps the parent and its other replies", async () => {
        const { alice, bob, manga } = await setup();
        const parent = await commentOnManga(alice, manga._id);
        const replyOne = await commentOnManga(bob, manga._id, { content: "reply 1", parentCommentId: parent.body.data._id });
        await commentOnManga(alice, manga._id, { content: "reply 2", parentCommentId: parent.body.data._id });

        await http().delete(`/api/v1/comments/${replyOne.body.data._id}`).set(bearer(bob));

        const list = await http().get(`/api/v1/manga/${manga._id}/comments`);
        expect(list.body.data).toHaveLength(1);
        expect(list.body.data[0].replies.map((r: { content: string }) => r.content)).toEqual(["reply 2"]);
    });

    it("a stranger gets 403; a moderator and an admin can delete anyone's comment", async () => {
        const { admin, alice, bob, manga } = await setup();
        const moderator = await createModerator();
        const first = await commentOnManga(alice, manga._id);

        expect((await http().delete(`/api/v1/comments/${first.body.data._id}`).set(bearer(bob))).status).toBe(403);
        expect(await Comment.countDocuments()).toBe(1);

        expect((await http().delete(`/api/v1/comments/${first.body.data._id}`).set(bearer(moderator))).status).toBe(200);

        const second = await commentOnManga(alice, manga._id);
        expect((await http().delete(`/api/v1/comments/${second.body.data._id}`).set(bearer(admin))).status).toBe(200);
        expect(await Comment.countDocuments()).toBe(0);
    });

    it("returns 404 for an unknown comment, 400 for a malformed id, 401 without a token", async () => {
        const { alice } = await setup();

        expect((await http().delete(`/api/v1/comments/${randomId()}`).set(bearer(alice))).status).toBe(404);
        expect((await http().delete("/api/v1/comments/nope").set(bearer(alice))).status).toBe(400);
        expect((await http().delete(`/api/v1/comments/${randomId()}`)).status).toBe(401);
    });
});
