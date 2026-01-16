const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

/* ---------------- Cloudinary Config ---------------- */
try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (!cloudinaryUrl) {
        throw new Error('CLOUDINARY_URL not found in environment variables');
    }

    const urlParts = cloudinaryUrl.replace('cloudinary://', '').split('@');
    const [credentials, cloudName] = urlParts;
    const [apiKey, apiSecret] = credentials.split(':');

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    console.log(' Cloudinary configured successfully');
} catch (error) {
    console.error(' Cloudinary configuration error:', error.message);
}

/* ---------------- Multer + Cloudinary Storage ---------------- */
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bottle_craft',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

/* ---------------- Upload Route ---------------- */
router.post('/', (req, res) => {
    console.log(' Upload request received');

    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error(' Upload Error:', err.message);

            const statusCode =
                err.message?.toLowerCase().includes('not allowed') ||
                err.code === 'LIMIT_FILE_SIZE'
                    ? 400
                    : 500;

            return res.status(statusCode).json({
                message: 'Upload failed',
                error: err.message,
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded',
            });
        }

        console.log(' File uploaded:', req.file.path);

        res.status(200).json({
            filePath: req.file.path,
        });
    });
});

module.exports = router;
