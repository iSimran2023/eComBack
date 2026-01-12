const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String, // Will be hashed
        required: true
    },
    role: {
        type: String,
        default: 'admin'
    }
});

module.exports = mongoose.model('User', UserSchema);
