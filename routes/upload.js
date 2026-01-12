const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
dotenv.config();
// Configure Cloudinary
try {
    // Parse the CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    console.log('Configuring Cloudinary...');
    if (!cloudinaryUrl) {
        throw new Error('CLOUDINARY_URL not found in environment variables');
    }
    const urlParts = cloudinaryUrl.replace('cloudinary://', '').split('@');
    const [credentials, cloudName] = urlParts;
    const [apiKey, apiSecret] = credentials.split(':');
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    console.log('Cloudinary configured successfully');
} catch (error) {
    console.error('Cloudinary configuration error:', error.message);
}
// Configure Multi-Storage (Local for backup/temp or just Cloudinary)
// Using Cloudinary directly with Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'bottle_craft',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage: storage });
// Upload Endpoint with error handling
router.post('/', (req, res) => {
    console.log('Upload request received');
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary Error:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            return res.status(500).json({
                message: 'Upload failed',
                error: err.message,
                details: err.toString()
            });
        }
        try {
            if (!req.file) {
                console.log('No file in request');
                return res.status(400).json({ message: 'No file uploaded' });
            }
            console.log('File uploaded to Cloudinary:', req.file.path);
            res.json({ filePath: req.file.path });
        } catch (error) {
            console.error('Upload Error:', error);
            res.status(500).json({ message: 'Upload failed', error: error.message });
        }
    });
});
module.exports = router;
