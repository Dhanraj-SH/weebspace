import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import mangaRoutes from "./routes/mangaRoutes.js";
import progressRoutes from "./routes/readingProgressRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Render terminates TLS at its proxy. Trust only that first hop so Express
// reports the original client IP to rate limiters and request handlers.
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.status(200).json({ data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/manga", mangaRoutes);
app.use("/api/v1/manga", ratingRoutes);
app.use("/api/v1/library", libraryRoutes);
app.use("/api/v1/reading-progress", progressRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/uploads", uploadRoutes);

app.use("/api/v1", chapterRoutes);
app.use("/api/v1", reviewRoutes);
app.use("/api/v1", commentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
