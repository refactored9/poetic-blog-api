const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');

// Helper to generate unique slug
async function generateUniqueSlug(name, existingId = null) {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    const existing = await Guide.findOne(query);
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// GET /api/guides - Get all guides (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { published, featured, location, search, limit } = req.query;

    let query = {};

    // Filter by published status
    if (published === 'true') {
      query.isPublished = true;
    }

    // Filter by featured
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Filter by location
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
        { areasOfOperation: { $regex: location, $options: 'i' } },
      ];
    }

    // Search by text
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { areasOfOperation: { $regex: search, $options: 'i' } },
        { specializations: { $regex: search, $options: 'i' } },
      ];
    }

    let queryBuilder = Guide.find(query).sort({ isFeatured: -1, createdAt: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    const guides = await queryBuilder;

    res.json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ message: 'Failed to fetch guides' });
  }
});

// GET /api/guides/:idOrSlug - Get single guide by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    let guide;

    // Try to find by ID first
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      guide = await Guide.findById(idOrSlug);
    }

    // If not found by ID, try by slug
    if (!guide) {
      guide = await Guide.findOne({ slug: idOrSlug });
    }

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json(guide);
  } catch (error) {
    console.error('Error fetching guide:', error);
    res.status(500).json({ message: 'Failed to fetch guide' });
  }
});

// POST /api/guides - Create new guide
router.post('/', async (req, res) => {
  try {
    const guideData = req.body;

    // Generate unique slug
    guideData.slug = await generateUniqueSlug(guideData.name);

    const guide = new Guide(guideData);
    await guide.save();

    res.status(201).json(guide);
  } catch (error) {
    console.error('Error creating guide:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A guide with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create guide' });
  }
});

// PUT /api/guides/:id - Update guide
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If name is being updated, regenerate slug
    if (updateData.name) {
      const existingGuide = await Guide.findById(id);
      if (existingGuide && existingGuide.name !== updateData.name) {
        updateData.slug = await generateUniqueSlug(updateData.name, id);
      }
    }

    updateData.updatedAt = new Date();

    const guide = await Guide.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json(guide);
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({ message: 'Failed to update guide' });
  }
});

// DELETE /api/guides/:id - Delete guide
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guide = await Guide.findByIdAndDelete(id);

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ message: 'Failed to delete guide' });
  }
});

// GET /api/guides/locations/list - Get unique locations
router.get('/locations/list', async (req, res) => {
  try {
    const cities = await Guide.distinct('location.city', { isPublished: true });
    const states = await Guide.distinct('location.state', { isPublished: true });
    const countries = await Guide.distinct('location.country', { isPublished: true });
    const areas = await Guide.distinct('areasOfOperation', { isPublished: true });

    res.json({
      cities: cities.filter(Boolean),
      states: states.filter(Boolean),
      countries: countries.filter(Boolean),
      areas: areas.filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// GET /api/guides/specializations/list - Get unique specializations
router.get('/specializations/list', async (req, res) => {
  try {
    const specializations = await Guide.distinct('specializations', { isPublished: true });
    res.json(specializations.filter(Boolean));
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ message: 'Failed to fetch specializations' });
  }
});

module.exports = router;
