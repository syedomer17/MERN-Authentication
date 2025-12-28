import express from 'express';
import { loginUser, myProfile, registerUser, verifyOtp, verifyUser } from '../controllers/user';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify/:token', verifyUser);
router.post('/login', loginUser);
router.post('/verify', verifyOtp);
router.get('/me', authMiddleware ,myProfile)

export default router;