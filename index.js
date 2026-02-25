import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';

// ─── Routes ────────────────────────────────────────────────────
import authRoutes from './Routes/authRoutes.js';
import driverRoutes from './Routes/driverRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import bookingRoutes from './Routes/bookingRoutes.js';
import poolRoutes from './Routes/poolRoutes.js';

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DB ────────────────────────────────────────────────────────
await connectDB();

// ─── API Routes ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ success: true, message: 'HybridRide API is running 🚗' });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/driver',   driverRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pools',    poolRoutes);
app.use('/uploads', express.static('uploads'));

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
