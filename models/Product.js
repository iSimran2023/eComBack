const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String, // URL or path
        required: true
    },
    category: {
        type: String,
        default: 'Bottle'
    },
    stock: {
        type: Number,
        default: 100
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    customizationFee: {
        type: Number,
        default: 5
    },
    allowCustomization: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
