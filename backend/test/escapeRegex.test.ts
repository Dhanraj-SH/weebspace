import { describe, expect, it } from "vitest";
import { escapeRegex } from "../src/utils/escapeRegex.js";

describe("escapeRegex", () => {
    it("escapes regex metacharacters", () => {
        expect(escapeRegex(".*+?^${}()|[]\\")).toBe(String.raw`\.\*\+\?\^\$\{\}\(\)\|\[\]\\`);
    });

    it("leaves ordinary search text unchanged", () => {
        expect(escapeRegex("One Piece")).toBe("One Piece");
    });

    it("makes special characters match literally", () => {
        const escaped = new RegExp(escapeRegex(".*"));

        expect(escaped.test(".*")).toBe(true);
        expect(escaped.test("anything")).toBe(false);
    });
});
