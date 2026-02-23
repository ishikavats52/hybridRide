import express from 'express';
import { register, login, getMe } from '../Controllers/authController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login

// Protected routes
router.get('/me', protect, getMe);    // GET  /api/auth/me

export default router;
