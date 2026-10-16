import { Router } from "express";
import { getMyRating, getRatingSummary, removeRating, saveRating } from "../controllers/ratingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:mangaId/ratings", getRatingSummary);
router.get("/:mangaId/ratings/me", authenticate, getMyRating);
router.put("/:mangaId/ratings/me", authenticate, saveRating);
router.delete("/:mangaId/ratings/me", authenticate, removeRating);

export default router;
