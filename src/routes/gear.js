const express = require('express');
const router = express.Router();
const Gear = require('../models/Gear');

// @route   GET /api/gear
// @desc    Get all gear items
router.get('/', async (req, res) => {
  try {
    const { published, category } = req.query;
    const filter = {};

    if (published === 'true') {
      filter.isPublished = true;
    } else if (published === 'false') {
      filter.isPublished = false;
    }

    if (category) {
      filter.category = category;
    }

    const gear = await Gear.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ data: gear });
  } catch (error) {
    console.error('Error fetching gear:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/gear/:id
// @desc    Get single gear item
router.get('/:id', async (req, res) => {
  try {
    const gear = await Gear.findById(req.params.id);

    if (!gear) {
      return res.status(404).json({ message: 'Gear not found' });
    }

    res.json({ data: gear });
  } catch (error) {
    console.error('Error fetching gear:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/gear
// @desc    Create a new gear item
router.post('/', async (req, res) => {
  try {
    const { name, category, description, image, amazonUrl, price, rating, isFavorite, isPublished, order } = req.body;

    const gear = new Gear({
      name,
      category,
      description,
      image,
      amazonUrl,
      price,
      rating,
      isFavorite: isFavorite || false,
      isPublished: isPublished !== false,
      order: order || 0,
    });

    const savedGear = await gear.save();
    res.status(201).json({ data: savedGear });
  } catch (error) {
    console.error('Error creating gear:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/gear/:id
// @desc    Update a gear item
router.put('/:id', async (req, res) => {
  try {
    const { name, category, description, image, amazonUrl, price, rating, isFavorite, isPublished, order } = req.body;

    const gear = await Gear.findById(req.params.id);

    if (!gear) {
      return res.status(404).json({ message: 'Gear not found' });
    }

    if (name !== undefined) gear.name = name;
    if (category !== undefined) gear.category = category;
    if (description !== undefined) gear.description = description;
    if (image !== undefined) gear.image = image;
    if (amazonUrl !== undefined) gear.amazonUrl = amazonUrl;
    if (price !== undefined) gear.price = price;
    if (rating !== undefined) gear.rating = rating;
    if (isFavorite !== undefined) gear.isFavorite = isFavorite;
    if (isPublished !== undefined) gear.isPublished = isPublished;
    if (order !== undefined) gear.order = order;

    const updatedGear = await gear.save();
    res.json({ data: updatedGear });
  } catch (error) {
    console.error('Error updating gear:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/gear/:id
// @desc    Delete a gear item
router.delete('/:id', async (req, res) => {
  try {
    const gear = await Gear.findByIdAndDelete(req.params.id);

    if (!gear) {
      return res.status(404).json({ message: 'Gear not found' });
    }

    res.json({ message: 'Gear deleted successfully' });
  } catch (error) {
    console.error('Error deleting gear:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
