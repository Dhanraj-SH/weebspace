import { Router } from "express";
import { getRating, removeRating, saveRating } from "../controllers/ratingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:mangaId/ratings", authenticate, getRating);
router.put("/:mangaId/ratings", authenticate, saveRating);
router.delete("/:mangaId/ratings", authenticate, removeRating);

export default router;