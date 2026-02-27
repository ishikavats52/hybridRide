import express from 'express';
import { createOrder, verifyPayment } from '../Controllers/paymentController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

export default router;
