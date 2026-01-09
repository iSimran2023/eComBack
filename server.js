const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eCom';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected to:', MONGO_URI.includes('cluster') ? 'Atlas Cloud' : 'Local DB'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Debug: Make sure your IP is whitelisted in MongoDB Atlas (Network Access tab)');
    });

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('Bottle Customizer API is running');
});

// Import Routes
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// Catch-all 404 Logger
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
