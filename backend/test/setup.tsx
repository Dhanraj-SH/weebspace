import { vi } from "vitest";

declare const process: { env: Record<string, string | undefined> };

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/weebspace-test";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-long-enough-for-validation-123";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-long-enough-for-validation-456";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.R2_PUBLIC_URL = "https://media.test";

vi.mock("../src/providers/storageProvider.js", () => ({
    UPLOAD_URL_EXPIRES_IN: 300,
    createUploadUrl: vi.fn(async (key: string) => `https://r2.test/upload/${key}?signature=fake`),
    headObject: vi.fn(async () => ({ contentType: "image/webp", size: 1 })),
    deleteObject: vi.fn(async () => undefined),
    deleteByPrefix: vi.fn(async () => undefined),
}));