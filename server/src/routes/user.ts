import express from "express";
import {
  loginUser,
  logoutUser,
  myProfile,
  refreshCSRF,
  refreshToken,
  registerUser,
  verifyOtp,
  verifyUser,
} from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";
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

export default router;
