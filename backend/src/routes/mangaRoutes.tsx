import { Router } from "express";
import { getManga, getMangaByIdController, createMangaController, updateMangaController, deleteMangaController } from "../controllers/mangaController.js";

const router = Router();

router.get("/", getManga);
router.get("/:mangaId", getMangaByIdController);
router.post("/", createMangaController);
router.patch("/:mangaId", updateMangaController);
router.delete("/:mangaId", deleteMangaController);

export default router;