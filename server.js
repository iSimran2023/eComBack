const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

/* ---------- CORS (FIXED) ---------- */
const corsOptions = {
    origin: [
        'https://ecom-custom-nep.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
// In Express 5, app.options('*') can cause issues with strict routing validation.
// cors middleware handles preflight automatically for mounted routes.

/* ---------- Middleware ---------- */
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------- MongoDB ---------- */
let isConnected = false;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) {
        isConnected = true;
        return;
    }

    try {
        // Don't catch here, let the middleware catch it
        // Set short timeout for Vercel (default is 30s, which effectively is > function timeout)
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // 5 seconds
        });
        isConnected = true;
        console.log('✅ MongoDB connected (Vercel)');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        throw err; // Re-throw so middleware can catch it
    }
}

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    if (!isConnected) {
        try {
            await connectDB();
        } catch (err) {
            console.error('Failed to connect to DB for request');
            return res.status(500).json({
                message: 'Database connection failed',
                error: err.message
            });
        }
    }
    next();
});

/* ---------- Routes ---------- */
app.get('/', (req, res) => {
    res.send('API is running');
});

app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));

/* ---------- 404 ---------- */
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
