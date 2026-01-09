const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// Get all settings or specific core ones
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find();
        // Return as an object for easier frontend consumption: { key: value }
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);

        // Add defaults if missing
        if (!settingsObj.deliveryInsideValley) settingsObj.deliveryInsideValley = 50;
        if (!settingsObj.deliveryOutsideValley) settingsObj.deliveryOutsideValley = 150;

        res.json(settingsObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings (Admin only - adding basic auth check placeholder or just public for now as per project style)
router.post('/', async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value }
        const results = [];

        for (const [key, value] of Object.entries(updates)) {
            const setting = await Setting.findOneAndUpdate(
                { key },
                { key, value },
                { upsert: true, new: true }
            );
            results.push(setting);
        }

        res.json({ message: 'Settings updated successfully', settings: results });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
