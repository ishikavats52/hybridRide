
import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, driverOnly } from '../Middleware/authMiddleware.js'; // Assuming auth middleware exists
import { 
    getDriverProfile, 
    updateDriverProfile, 
    toggleOnline,
    uploadDocument,
    getOnlineDrivers
} from '../Controllers/driverController.js';

const router = express.Router();

// --- MultConfig ---
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // e.g. driver-ID-timestamp.ext
        cb(null, `driver-${req.user ? req.user._id : 'unknown'}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images or PDFs Only!');
        }
    }
});


// Routes
router.get('/profile', protect, driverOnly, getDriverProfile);
router.put('/profile', protect, driverOnly, updateDriverProfile);
router.post('/status', protect, driverOnly, toggleOnline);
router.get('/online', protect, getOnlineDrivers);

// Upload Route with Error Handling
router.post('/upload', protect, driverOnly, (req, res, next) => {
    upload.single('document')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ success: false, message: `Multer Error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ success: false, message: err });
        }
        // Everything went fine.
        next();
    });
}, uploadDocument);

export default router;
