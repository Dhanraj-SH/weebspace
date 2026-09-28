import express from 'express';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/auth", authRoutes);
app.use(errorHandler);

export default app;