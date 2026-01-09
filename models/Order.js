const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, default: 1 },
            customization: {
                text: { type: String },
                instructions: { type: String },
                logoPath: { type: String },
                hasFee: { type: Boolean, default: false },
                customizationFee: { type: Number, default: 0 }
            }
        }
    ],
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    deliveryRegion: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Delivered'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
