import { Router } from 'express';
import { getMe, getUserById, updateMyProfile, updateUserById } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMyProfile);

router.get("/:userId", authenticate, getUserById);
router.patch("/:userId",authenticate, updateUserById);

export default router;