import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { errorHandler } from "../src/middleware/errorHandler.js";

const createErrorTestApp = (errorFactory: () => Error) => {
    const app = express();
    app.get("/error", (_req, _res, next) => next(errorFactory()));
    app.use(errorHandler);
    return app;
};

describe("errorHandler", () => {
    it("maps Mongo duplicate-key errors to 409", async () => {
        const duplicateKeyError = Object.assign(new Error("duplicate key"), { code: 11000 });
        const app = createErrorTestApp(() => duplicateKeyError);
        const response = await request(app).get("/error");

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("DUPLICATE_RESOURCE");
    });

    it("maps Mongoose CastError to 400", async () => {
        const castError = new mongoose.Error.CastError("ObjectId", "not-an-id", "_id");
        const app = createErrorTestApp(() => castError);
        const response = await request(app).get("/error");

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("INVALID_ID");
    });

    it("does not expose unexpected internal error messages", async () => {
        const app = createErrorTestApp(() => new Error("secret database detail"));
        const response = await request(app).get("/error");

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
        expect(response.body.error.message).toBe("Internal server error");
        expect(JSON.stringify(response.body)).not.toContain("secret database detail");
    });
});
