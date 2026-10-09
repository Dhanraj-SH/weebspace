import {Router} from "express";
import { getChapter, getChaptersByManga, createChapter, updateChapter, deleteChapter } from "../controllers/chapterController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/manga/:mangaId/chapters", getChaptersByManga);
router.post("/manga/:mangaId/chapters", authenticate, authorize(UserRole.Admin), createChapter);

router.get("/chapters/:chapterId", getChapter);
router.patch("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), updateChapter);
router.delete("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), deleteChapter);

export default router;