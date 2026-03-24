import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// Cloudinary Storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        const userId = req.user ? req.user._id.toString() : 'unknown';
        return {
            folder: 'hybrid_ride_uploads',
            format: 'jpg',
            public_id: `upload-${userId}-${Date.now()}`,
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;
