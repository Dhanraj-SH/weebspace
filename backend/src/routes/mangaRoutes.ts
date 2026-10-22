import { Router } from "express";
import { createMangaController, deleteMangaController, getMangaDetails, getMangaList, recordMangaViewController, updateMangaController } from "../controllers/mangaController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { viewLimiter } from "../middleware/rateLimiters.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/", getMangaList);
router.post("/:mangaId/views", viewLimiter, recordMangaViewController);
router.get("/:mangaId", getMangaDetails);
router.post("/", authenticate, authorize(UserRole.Admin), createMangaController);
router.patch("/:mangaId", authenticate, authorize(UserRole.Admin), updateMangaController);
router.delete("/:mangaId", authenticate, authorize(UserRole.Admin), deleteMangaController);

export default router;
