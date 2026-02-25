import express from 'express';
import { protect, driverOnly } from '../Middleware/authMiddleware.js';
import {
    publishRide,
    searchRides,
    bookSeat,
    getDriverPools,
    getPassengerPools
} from '../Controllers/poolController.js';

const router = express.Router();

// All pooling routes require authentication
router.use(protect);

// ─── Passenger Routes ─────────────────────────────────────
// GET    /api/pools/search       → Search for available pools
// POST   /api/pools/:id/book     → Book (claim) seats in a pool
// GET    /api/pools/history      → Get pools passenger has joined

router.get('/search', searchRides);
router.post('/:id/book', bookSeat);
router.get('/history', getPassengerPools);

// ─── Driver Routes ────────────────────────────────────────
// POST   /api/pools/publish      → Driver publishes a City, Outstation, or Rental pool
// GET    /api/pools/driver-history → Driver returns active and past pools they host

router.post('/publish', driverOnly, publishRide);
router.get('/driver-history', driverOnly, getDriverPools);

export default router;
