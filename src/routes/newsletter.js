const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendWelcomeEmail } = require('../services/email');

// @route   GET /api/newsletter
// @desc    Get all subscribers
router.get('/', async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/newsletter
// @desc    Subscribe to newsletter
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if already subscribed
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    // Create new subscriber
    const subscriber = new Newsletter({
      email: email.toLowerCase(),
    });

    await subscriber.save();

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email);

    if (emailResult.success) {
      res.status(201).json({
        message: 'Successfully subscribed! Check your inbox for a welcome email.',
        id: subscriber._id,
      });
    } else {
      res.status(201).json({
        message: 'Successfully subscribed!',
        id: subscriber._id,
      });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter (alias for POST /api/newsletter)
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    const subscriber = new Newsletter({
      email: email.toLowerCase(),
    });

    await subscriber.save();

    const emailResult = await sendWelcomeEmail(email);

    if (emailResult.success) {
      res.json({
        message: 'Successfully subscribed! Check your inbox for a welcome email.',
        email: email,
      });
    } else {
      res.json({
        message: 'Successfully subscribed!',
        email: email,
        warning: 'Welcome email could not be sent',
      });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/newsletter/:id
// @desc    Delete/unsubscribe a subscriber
router.delete('/:id', async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.json({ message: 'Subscriber removed successfully' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
