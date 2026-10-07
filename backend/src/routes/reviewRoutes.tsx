import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createReview, deleteReview, getReview, getReviewByManga, updateReview } from "../controllers/reviewController.js";

const router = Router();

router.get("/manga/:mangaId/reviews", getReviewByManga);
router.get("/reviews/:reviewId", getReview);
router.post("/manga/:mangaId/reviews", authenticate, createReview);
router.patch("/reviews/:reviewId", authenticate, updateReview);
router.delete("/reviews/:reviewId", authenticate, deleteReview);

export default router;