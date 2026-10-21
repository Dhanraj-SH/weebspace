import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer: MongoMemoryServer | undefined;

// Tests delete data, so they may only ever talk to a LOCAL database, never Atlas / production.
const LOCAL_URI = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;

/**
 * Connects mongoose to a throw-away database.
 * - Default: starts an in-memory MongoDB (mongodb-memory-server).
 * - Optional: set TEST_MONGODB_URI=mongodb://127.0.0.1:27017 to use a local mongod instead.
 * Every test file gets its own database name, so files can run in parallel safely.
 */
export const connectTestDb = async (): Promise<void> => {
    let uri = process.env.TEST_MONGODB_URI;

    if (!uri) {
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
    }

    if (!LOCAL_URI.test(uri)) {
        throw new Error(`Refusing to run tests against a non-local database: ${uri.replace(/\/\/.*@/, "//***@")}`);
    }

    await mongoose.connect(uri, { dbName: `weebspace_test_${randomBytes(4).toString("hex")}` });

    // Build the unique indexes (one review per user, one rating per user, ...) before any test runs
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
};

export const clearTestDb = async (): Promise<void> => {
    await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
};

export const disconnectTestDb = async (): Promise<void> => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await memoryServer?.stop();
};
