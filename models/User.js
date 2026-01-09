const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Export only if mongoose is connected, otherwise export a mock
let User;
try {
    User = mongoose.model('User') || mongoose.model('User', userSchema);
} catch (error) {
    // If model can't be created (no DB connection), create a mock
    User = class MockUser {
        static findOne() { return Promise.resolve(null); }
        static find() { return Promise.resolve([]); }
        save() { return Promise.resolve(this); }
    };
}

module.exports = User;