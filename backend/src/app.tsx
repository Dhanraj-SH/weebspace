import express from 'express';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import mangaRoutes from './routes/mangaRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/manga", mangaRoutes);
app.use("/api/v1", chapterRoutes);
app.use("/api/v1/library", libraryRoutes);
app.use(errorHandler);

export default app;