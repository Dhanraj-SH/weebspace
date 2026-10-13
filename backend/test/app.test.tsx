import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Express API", () => {
    it("returns 404 for an unknown route", async () => {
        const response = await request(app).get("/api/v1/this-route-does-not-exist");

        expect(response.status).toBe(404);
    });

    it("returns 400 with INVALID_JSON for malformed JSON", async () => {
        const response = await request(app)
            .post("/api/v1/auth/register")
            .set("Content-Type", "application/json")
            .send('{"username":');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: {
                code: "INVALID_JSON",
                message: "Request body contains malformed JSON",
            },
        });
    });

    it("rejects unauthenticated requests to the current-user endpoint", async () => {
        const response = await request(app).get("/api/v1/users/me");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");
    });

    it("rejects unauthenticated requests to admin user management", async () => {
        const response = await request(app).get("/api/v1/admin/users");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");
    });

    it("rejects unauthenticated manga creation", async () => {
        const response = await request(app)
            .post("/api/v1/manga")
            .send({ title: "Test Manga" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");
    });
});
