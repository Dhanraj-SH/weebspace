import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";
import { getAllUsers, updateRole } from "../controllers/adminController.js";
import { createMangaController, deleteMangaController, updateMangaController } from "../controllers/mangaController.js";
import { createChapter, deleteChapter, updateChapter } from "../controllers/chapterController.js";

const router = Router();

router.post("/manga", authenticate, authorize(UserRole.Admin), createMangaController);
router.patch("/manga/:mangaId", authenticate, authorize(UserRole.Admin), updateMangaController);
router.delete("/manga/:mangaId", authenticate, authorize(UserRole.Admin), deleteMangaController);

router.post("/manga/:mangaId/chapters", authenticate, authorize(UserRole.Admin), createChapter);
router.patch("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), updateChapter);
router.delete("/chapters/:chapterId", authenticate, authorize(UserRole.Admin), deleteChapter);

router.get("/users", authenticate, authorize(UserRole.Admin), getAllUsers);
router.patch("/users/:userId", authenticate, authorize(UserRole.Admin), updateRole);

export default router;