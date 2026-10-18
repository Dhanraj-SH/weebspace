import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorizeMiddleware.js";
import { UserRole } from "../models/userModel.js";
import { presignUpload } from "../controllers/uploadController.js";

const router = Router();

router.post("/presign", authenticate, authorize(UserRole.Admin), presignUpload);
export default router;