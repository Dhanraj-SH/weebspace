import {Router} from "express";
import { getChapter, getChaptersByManga, createChapter, updateChapter, deleteChapter } from "../controllers/chapterController.js";

const router = Router();

router.get("/manga/:mangaId/chapters", getChaptersByManga);
router.post("/manga/:mangaId/chapters", createChapter);

router.get("/chapters/:chapterId", getChapter);
router.patch("/chapters/:chapterId", updateChapter);
router.delete("/chapters/:chapterId", deleteChapter);

export default router;