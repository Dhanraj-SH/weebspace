import { Router } from "express";
import { createLibrary, deleteLibrary, getLibrary, updateLibrary } from "../controllers/libraryController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getLibrary);
router.post("/", createLibrary);
router.patch("/:mangaId", updateLibrary);
router.delete("/:mangaId", deleteLibrary);

export default router;
