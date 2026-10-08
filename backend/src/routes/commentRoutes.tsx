import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createComment, getCommentByManga, createCommentByChapter, getCommentByChapter, updateComment, deleteComment } from "../controllers/commentController.js";

const router = Router();

router.post("/manga/:mangaId/comments", authenticate, createComment);
router.get("/manga/:mangaId/comments", getCommentByManga);
router.post("/chapters/:chapterId/comments", authenticate, createCommentByChapter);
router.get("/chapters/:chapterId/comments", getCommentByChapter);
router.patch("/comments/:commentId", authenticate, updateComment);
router.delete("/comments/:commentId", authenticate, deleteComment);

export default router;