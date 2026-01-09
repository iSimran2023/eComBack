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

console.log('=== DEBUG INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('Using connection:', process.env.MONGO_URI ? 'Atlas (from env)' : 'Local fallback');

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected to:', MONGO_URI.includes('cluster') ? 'Atlas Cloud' : 'Local DB');
        console.log('Ready State:', mongoose.connection.readyState);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('Debug: Make sure your IP is whitelisted in MongoDB Atlas (Network Access tab)');
    });

// ========== DEBUG ROUTES ==========
// ADD THESE BEFORE YOUR REGULAR ROUTES

// 1. Simple test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working',
        timestamp: new Date().toISOString(),
        mongoState: mongoose.connection.readyState,
        mongoStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
    });
});

// 2. Database test route
app.get('/api/test-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        res.json({
            mongoDB: {
                connected: state === 1,
                state: state,
                stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][state],
                host: mongoose.connection.host || 'N/A',
                name: mongoose.connection.name || 'N/A'
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                mongoUriSet: !!process.env.MONGO_URI,
                mongoUriFirstChars: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'Not set'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Test auth without DB
app.post('/api/auth/test', (req, res) => {
    console.log('Test auth hit:', req.body);
    res.json({ 
        message: 'Auth test endpoint working',
        received: req.body,
        timestamp: new Date().toISOString()
    });
});

// 4. Hardcoded login for testing
app.post('/api/auth/login-test', (req, res) => {
    console.log('Login test:', req.body);
    
    if (req.body.email === 'admin@example.com' && req.body.password === 'admin123') {
        return res.json({
            success: true,
            token: 'test-jwt-token-from-vercel',
            user: {
                id: 'test-user-123',
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin'
            }
        });
    }
    
    res.status(401).json({
        success: false,
        message: 'Invalid credentials. Use admin@example.com / admin123'
    });
});

// ========== YOUR EXISTING ROUTES ==========
// Routes
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