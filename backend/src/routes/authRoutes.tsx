import { Router, type Request } from "express";
import { register, login, getMe, logout, refresh } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me",authenticate, getMe);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout); 

export default router;