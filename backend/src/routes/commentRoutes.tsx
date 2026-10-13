import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createChapterComment, createMangaComment, deleteComment, getChapterComments, getMangaComments, updateComment } from "../controllers/commentController.js";

const router = Router();

router.get("/manga/:mangaId/comments", getMangaComments);
router.post("/manga/:mangaId/comments", authenticate, createMangaComment);

router.get("/chapters/:chapterId/comments", getChapterComments);
router.post("/chapters/:chapterId/comments", authenticate, createChapterComment);

router.patch("/comments/:commentId", authenticate, updateComment);
router.delete("/comments/:commentId", authenticate, deleteComment);

export default router;
