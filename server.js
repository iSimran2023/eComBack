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

// ========== DATABASE CONNECTION WITH FALLBACK ==========
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

let isMongoConnected = false;

const connectMongoDB = async () => {
    try {
        // Use local MongoDB for development, Atlas for production
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eCom';
        
        console.log('Connecting to MongoDB...');
        console.log('URI starts with:', mongoUri.substring(0, 50) + '...');
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        isMongoConnected = true;
        console.log('✅ MongoDB Connected successfully');
        console.log('Connection state:', mongoose.connection.readyState);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        console.log('⚠️  Running in FALLBACK MODE (No database)');
        isMongoConnected = false;
        
        // Don't throw error - run in fallback mode
        // This allows the server to start even without DB
    }
};

connectMongoDB();

// ========== SIMPLE TEST ROUTES ==========
app.get('/', (req, res) => {
    res.json({
        message: 'API is running',
        database: isMongoConnected ? 'Connected' : 'Fallback mode (no DB)',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
            connected: isMongoConnected,
            state: mongoose.connection.readyState
        }
    });
});

// ========== AUTH ROUTES WITH FALLBACK ==========
// Simple login that works with or without database
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Hardcoded admin credentials that always work
    if (email === 'admin@example.com' && password === 'admin123') {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: 'admin-id-123', email: 'admin@example.com', role: 'admin' },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '7d' }
        );
        
        return res.json({
            success: true,
            token: token,
            user: {
                id: 'admin-id-123',
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin'
            },
            mode: isMongoConnected ? 'Database mode' : 'Fallback mode'
        });
    }
    
    // If DB is connected, try to find user in database
    if (isMongoConnected) {
        try {
            const User = require('./models/User');
            const bcrypt = require('bcryptjs');
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'default-secret-key',
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token: token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                mode: 'Database mode'
            });
            
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Fall through to error response
        }
    }
    
    // If we get here, credentials are wrong
    res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        hint: 'Try: admin@example.com / admin123'
    });
});

// Seed route that works in both modes
app.post('/api/auth/seed', async (req, res) => {
    if (!isMongoConnected) {
        return res.json({
            success: true,
            message: 'Database not connected. Using hardcoded admin: admin@example.com / admin123'
        });
    }
    
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            return res.json({
                success: true,
                message: 'Admin user already exists'
            });
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin'
        });
        
        await adminUser.save();
        
        res.json({
            success: true,
            message: 'Admin user created: admin@example.com / admin123'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== IMPORT OTHER ROUTES ==========
// Import Routes
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// ========== CATCH-ALL ROUTE ==========
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
        message: `Route ${req.method} ${req.url} not found`,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/seed'
        ]
    });
});

// ========== START SERVER ==========
// Export for Vercel
module.exports = (req, res) => {
    return app(req, res);
};

// For local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Database: ${isMongoConnected ? 'Connected' : 'Fallback mode'}`);
    });
}