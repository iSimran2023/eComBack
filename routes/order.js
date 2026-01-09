const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create Order (Public/Customer)
router.post('/', async (req, res) => {
    try {
        const { customerName, address, phone, items, totalAmount, deliveryCharge, deliveryRegion } = req.body;
        const order = new Order({
            customerName,
            address,
            phone,
            items,
            totalAmount,
            deliveryCharge: deliveryCharge || 0,
            deliveryRegion: deliveryRegion || 'Regular'
        });
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get All Orders (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.product').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Backfill Script (One-time Admin)
router.get('/action/backfill-fees', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.product');
        let updatedCount = 0;

        for (let order of orders) {
            let changed = false;
            for (let item of order.items) {
                // If it has a customization but NO fee stored yet (or it's undefined)
                if (item.customization.hasFee && (item.customization.customizationFee === undefined || item.customization.customizationFee === 0)) {
                    // Freeze at current product fee or fallback to 5
                    item.customization.customizationFee = item.product?.customizationFee ?? 5;
                    changed = true;
                }
            }
            if (changed) {
                await order.save();
                updatedCount++;
            }
        }
        res.json({ message: `Successfully backfilled ${updatedCount} orders.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single Order (Public - Tracking with 7 day limit)
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Check if older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (new Date(order.createdAt) < sevenDaysAgo) {
            return res.status(403).json({ message: 'Tracking information expired (older than 7 days)' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Order Status (Admin)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
