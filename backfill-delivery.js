const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const Product = require('./models/Product');

dotenv.config();

const backfillDeliveryCharges = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all orders with missing or zero delivery charges
        const orders = await Order.find({
            $or: [
                { deliveryCharge: { $exists: false } },
                { deliveryCharge: 0 },
                { deliveryRegion: { $exists: false } }
            ]
        }).populate('items.product');

        console.log(`Found ${orders.length} orders to backfill`);

        let updatedCount = 0;

        for (let order of orders) {
            // Calculate items subtotal
            const itemsSubtotal = order.items.reduce((sum, item) => {
                const itemPrice = (item.product?.price || 0) * item.quantity;
                return sum + itemPrice;
            }, 0);

            // Calculate customization fees
            const customizationTotal = order.items.reduce((sum, item) => {
                return sum + (item.customization?.customizationFee || 0);
            }, 0);

            // Derive delivery charge from total
            const derivedDeliveryCharge = order.totalAmount - itemsSubtotal - customizationTotal;

            // Only update if the derived charge makes sense (positive and reasonable)
            if (derivedDeliveryCharge >= 0 && derivedDeliveryCharge <= 200) {
                order.deliveryCharge = derivedDeliveryCharge;

                // Guess the region based on the charge
                if (derivedDeliveryCharge === 50) {
                    order.deliveryRegion = 'Inside Valley';
                } else if (derivedDeliveryCharge === 150) {
                    order.deliveryRegion = 'Outside Valley';
                } else {
                    order.deliveryRegion = 'Regular';
                }

                await order.save();
                updatedCount++;
                console.log(`Updated Order ${order._id}: Delivery = NPR ${derivedDeliveryCharge.toFixed(2)} (${order.deliveryRegion})`);
            } else {
                console.log(`Skipped Order ${order._id}: Calculated delivery charge (${derivedDeliveryCharge}) seems incorrect`);
            }
        }

        console.log(`\n Backfill complete! Updated ${updatedCount} out of ${orders.length} orders.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during backfill:', error);
        process.exit(1);
    }
};

backfillDeliveryCharges();
