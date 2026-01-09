const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get All Products
router.get('/', async (req, res) => {
    try {
        const { category, isFeatured } = req.query;
        let query = {};
        if (category) query.category = category;
        if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Featured Products
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single Product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Product (Admin only - simplified for now without middleware check)
router.post('/', async (req, res) => {
    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        image: req.body.image,
        category: req.body.category,
        stock: req.body.stock,
        isFeatured: req.body.isFeatured,
        customizationFee: req.body.customizationFee,
        allowCustomization: req.body.allowCustomization
    });

    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/:id', async (req, res) => {
    console.log('PATCH Request Received for ID:', req.params.id);
    // DEBUG: Immediate response to rule out 404
    // return res.json({ debug: "Matched PATCH route", id: req.params.id }); 

    try {
        console.log('Update Request Body:', req.body);
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!product) {
            console.log('Product not found for update:', req.params.id);
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Update Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete Product
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
