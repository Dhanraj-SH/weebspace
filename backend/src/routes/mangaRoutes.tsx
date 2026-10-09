import { Router } from "express";
import { getManga, getMangaByIdController, createMangaController, updateMangaController, deleteMangaController } from "../controllers/mangaController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/", getManga);
router.get("/:mangaId", getMangaByIdController);
router.post("/", authenticate, authorize(UserRole.Admin), createMangaController);
router.patch("/:mangaId", authenticate, authorize(UserRole.Admin), updateMangaController);
router.delete("/:mangaId",authenticate, authorize(UserRole.Admin), deleteMangaController);

export default router;