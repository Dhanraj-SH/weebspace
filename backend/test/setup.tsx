/// <reference types="node" />
import 'dotenv/config';

process.env.NODE_ENV ??= "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/weebspace-test";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-long-enough-for-validation-123";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-long-enough-for-validation-456";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
