const express = require('express');
const router = express.Router();
const Journey = require('../models/Journey');

// @route   GET /api/journeys
// @desc    Get all journeys
router.get('/', async (req, res) => {
  try {
    const { published } = req.query;
    const filter = {};

    if (published === 'true') {
      filter.isPublished = true;
    } else if (published === 'false') {
      filter.isPublished = false;
    }

    const journeys = await Journey.find(filter).sort({ date: -1 });
    res.json(journeys);
  } catch (error) {
    console.error('Error fetching journeys:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/journeys/treks
// @desc    Get all journeys with enabled routes (treks)
router.get('/treks', async (req, res) => {
  try {
    const journeys = await Journey.find({
      isPublished: true,
      'route.enabled': true,
    }).sort({ date: -1 });
    res.json(journeys);
  } catch (error) {
    console.error('Error fetching treks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/journeys/:id
// @desc    Get single journey by ID
router.get('/:id', async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    res.json(journey);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/journeys
// @desc    Create a new journey
router.post('/', async (req, res) => {
  try {
    const { title, description, coverImage, images, location, date, isPublished, route } = req.body;

    const journey = new Journey({
      title,
      description,
      coverImage,
      images: images || [],
      location,
      date: date || new Date(),
      isPublished: isPublished || false,
      route: route || undefined,
    });

    const savedJourney = await journey.save();
    res.status(201).json(savedJourney);
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/journeys/:id
// @desc    Update a journey
router.put('/:id', async (req, res) => {
  try {
    const { title, description, coverImage, images, location, date, isPublished, route } = req.body;

    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    if (title) journey.title = title;
    if (description !== undefined) journey.description = description;
    if (coverImage !== undefined) journey.coverImage = coverImage;
    if (images) journey.images = images;
    if (location !== undefined) journey.location = location;
    if (date) journey.date = date;
    if (isPublished !== undefined) journey.isPublished = isPublished;
    if (route !== undefined) journey.route = route;

    const updatedJourney = await journey.save();
    res.json(updatedJourney);
  } catch (error) {
    console.error('Error updating journey:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/journeys/:id
// @desc    Delete a journey
router.delete('/:id', async (req, res) => {
  try {
    const journey = await Journey.findByIdAndDelete(req.params.id);

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    res.json({ message: 'Journey deleted successfully' });
  } catch (error) {
    console.error('Error deleting journey:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
