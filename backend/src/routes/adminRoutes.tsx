import { Router } from "express";
import { getAllUsers, updateRole } from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";

const router = Router();

router.use(authenticate, authorize(UserRole.Admin));

router.get("/users", getAllUsers);
router.patch("/users/:userId", updateRole);

export default router;
