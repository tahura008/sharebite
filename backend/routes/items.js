const express = require('express');
const router = express.Router();
const FoodItem = require('../models/foodItem');
const { requireAuth } = require('../middleware/auth');

// GET all available items (public)
router.get('/', async (req, res) => {
  try {
    const items = await FoodItem.find({ status: 'available' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all items including requested (public)
router.get('/all', async (req, res) => {
  try {
    const items = await FoodItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single item (public)
router.get('/:id', async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new donation — requires login
router.post('/', requireAuth, async (req, res) => {
  try {
    const newItem = new FoodItem({
      ...req.body,
      userEmail: req.user.email, // always use authenticated user's email
      status: 'available',
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update / request an item — requires login
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // If marking as requested, record who requested it
    const update = { ...req.body, updatedAt: Date.now() };
    if (req.body.requested) {
      update.requestedBy = req.user.email;
      update.status = 'requested';
    }
    const item = await FoodItem.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE item — requires login; only the owner can delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'You are not allowed to delete this item.' });
    }
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
