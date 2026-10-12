import { Router } from "express";
import { getManga, getMangaByIdController, createMangaController, updateMangaController, deleteMangaController, searchManga } from "../controllers/mangaController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.get("/search", searchManga);
router.get("/", getManga);
router.post("/", authenticate, authorize(UserRole.Admin), createMangaController);
router.get("/:mangaId", getMangaByIdController);
router.patch("/:mangaId", authenticate, authorize(UserRole.Admin), updateMangaController);
router.delete("/:mangaId",authenticate, authorize(UserRole.Admin), deleteMangaController);


export default router;