import { Router, type Request } from "express";
import { register, login } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

interface AuthenticatedRequest extends Request {
    userId?: string;
}

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/protected-test", authenticate, (req: AuthenticatedRequest, res) => {
    res.status(200).json({
        message: "You are authenticated",
        userId: req.userId,
    });
});

export default router;