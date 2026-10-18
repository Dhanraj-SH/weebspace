import { Router } from "express";
import { getMe, getUserById, updateMe } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.get("/:userId", getUserById);

export default router;
