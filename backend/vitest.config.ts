import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
        setupFiles: ["./test/setup.ts"],
        environment: "node",
        testTimeout: 15_000,
        // The first run downloads a MongoDB binary for mongodb-memory-server (cached afterwards)
        hookTimeout: 180_000,
        clearMocks: true,
        restoreMocks: true,
    },
});
