const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretString', { expiresIn: '1d' });
        res.json({ token, user: { email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed Admin (Run once)
router.post('/seed', async (req, res) => {
    try {
        const existing = await User.findOne({ email: 'admin@example.com' });
        if (existing) return res.status(400).json({ message: 'Admin already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const newUser = new User({
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });
        await newUser.save();
        res.json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
