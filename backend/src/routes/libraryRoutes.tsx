import { Router } from "express";
import { createLibrary, deleteLibrary, getLibrary, updateLibrary } from "../controllers/libraryController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/",authenticate, getLibrary);
router.post("/",authenticate, createLibrary);
router.patch("/:mangaId", authenticate, updateLibrary);
router.delete("/:mangaId", authenticate, deleteLibrary);

export default router;