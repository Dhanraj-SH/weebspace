import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { deleteProgress, getReadingProgress, listReadingProgress, saveProgress } from "../controllers/readingProgressController.js";

const router = Router();

router.use(authenticate);

router.get("/", listReadingProgress);
router.get("/:mangaId", getReadingProgress);
router.put("/:mangaId", saveProgress);
router.delete("/:mangaId", deleteProgress);

export default router;
