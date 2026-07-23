import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, logoutUser, getMe, changePassword } from '../controllers/authController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Narrow limit on credential-guessing endpoints; the general /api limiter
// in server.js is too loose to stop a focused brute-force attempt on its own.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

// Only an existing admin can create new logins for this app.
router.post('/register', protect, requireAdmin, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

export default router;
