import { Router } from "express";
import { createMangaController, deleteMangaController, getMangaDetails, getMangaList, updateMangaController } from "../controllers/mangaController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/", getMangaList);
router.get("/:mangaId", getMangaDetails);
router.post("/", authenticate, authorize(UserRole.Admin), createMangaController);
router.patch("/:mangaId", authenticate, authorize(UserRole.Admin), updateMangaController);
router.delete("/:mangaId", authenticate, authorize(UserRole.Admin), deleteMangaController);

export default router;
