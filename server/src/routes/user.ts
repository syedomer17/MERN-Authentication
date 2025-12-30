import express from "express";
import {
  adminController,
  loginUser,
  logoutUser,
  myProfile,
  refreshCSRF,
  refreshToken,
  registerUser,
  verifyOtp,
  verifyUser,
} from "../controllers/user";
import { adminMiddleware, authMiddleware } from "../middlewares/auth";
import { verifyCSRFToken } from "../config/csrf.Middleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.get("/me", authMiddleware, myProfile);
router.post("/refresh-token", refreshToken);
router.post("/logout", authMiddleware, verifyCSRFToken, logoutUser);
router.post("/refresh-csrf", authMiddleware, refreshCSRF);
router.get("/admin", authMiddleware, adminMiddleware, adminController);

export default router;
