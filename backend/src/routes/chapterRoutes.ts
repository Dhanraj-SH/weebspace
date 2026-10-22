import { Router } from "express";
import { createChapterController, deleteChapterController, getChapter, getChaptersByManga, recordChapterViewController, updateChapterController } from "../controllers/chapterController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { viewLimiter } from "../middleware/rateLimiters.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/manga/:mangaId/chapters", getChaptersByManga);
router.post("/manga/:mangaId/chapters", authenticate, authorize(UserRole.Admin), createChapterController);

router.get("/chapters/:chapterId", getChapter);
router.post("/chapters/:chapterId/views", viewLimiter, recordChapterViewController);
router.patch("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), updateChapterController);
router.delete("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), deleteChapterController);

export default router;
