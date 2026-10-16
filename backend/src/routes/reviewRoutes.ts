import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createReview, deleteReview, getReview, getReviewsByManga, likeReview, unlikeReview, updateReview } from "../controllers/reviewController.js";

const router = Router();

router.get("/manga/:mangaId/reviews", getReviewsByManga);
router.post("/manga/:mangaId/reviews", authenticate, createReview);

router.get("/reviews/:reviewId", getReview);
router.patch("/reviews/:reviewId", authenticate, updateReview);
router.delete("/reviews/:reviewId", authenticate, deleteReview);
router.post("/reviews/:reviewId/like", authenticate, likeReview);
router.delete("/reviews/:reviewId/like", authenticate, unlikeReview);

export default router;
