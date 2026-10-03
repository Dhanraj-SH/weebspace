import express from 'express';
import authRoutes from './routes/authRoutes.js';
import mangaRoutes from './routes/mangaRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/manga", mangaRoutes);
app.use("/api/v1", chapterRoutes);
app.use(errorHandler);

export default app;