const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });
const Order = require('./server/models/Order');
const Product = require('./server/models/Product');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eCom';
async function backfill() {
    try {
        console.log('Connecting to:', MONGO_URI);
        try {
            await mongoose.connect(MONGO_URI);
        } catch (e) {
            console.log('Primary connection failed, trying local...');
            await mongoose.connect('mongodb://127.0.0.1:27017/eCom');
        }
        console.log('Connected to DB');
        const orders = await Order.find().populate('items.product');
        let updatedCount = 0;
        for (let order of orders) {
            let changed = false;
            for (let item of order.items) {
                // If it has a customization but NO fee stored yet
                if (item.customization && item.customization.hasFee && item.customization.customizationFee === undefined) {
                    item.customization.customizationFee = item.product?.customizationFee ?? 5;
                    changed = true;
                }
            }
            if (changed) {
                await order.save();
                updatedCount++;
            }
        }
        console.log(`Successfully backfilled ${updatedCount} orders.`);
        process.exit(0);
    } catch (err) {
        console.error('Backfill Error:', err);
        process.exit(1);
    }
}
backfill();