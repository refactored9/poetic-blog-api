const express = require('express');
const router = express.Router();
const Reaction = require('../models/Reaction');
const mongoose = require('mongoose');

/**
 * @route   GET /api/reactions/:blogId
 * @desc    Get reaction counts for a blog
 */
router.get('/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const reactions = await Reaction.getReactionCounts(blogId);

    res.json({ reactions });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/reactions
 * @desc    Add a reaction to a blog
 */
router.post('/', async (req, res) => {
  try {
    const { blogId, reactionType, fingerprint } = req.body;

    // Validate required fields
    if (!blogId || !reactionType || !fingerprint) {
      return res.status(400).json({ message: 'Blog ID, reaction type, and fingerprint are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const validReactions = ['love', 'clap', 'fire', 'insightful', 'touching'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Try to create reaction (will fail if already exists due to unique index)
    try {
      const reaction = new Reaction({
        blogId,
        reactionType,
        fingerprint,
      });

      await reaction.save();

      const reactions = await Reaction.getReactionCounts(blogId);

      res.status(201).json({
        message: 'Reaction added',
        reactions,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate - user already reacted with this type
        return res.status(409).json({ message: 'Already reacted with this type' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/reactions
 * @desc    Remove a reaction from a blog
 */
router.delete('/', async (req, res) => {
  try {
    const { blogId, reactionType, fingerprint } = req.body;

    // Validate required fields
    if (!blogId || !reactionType || !fingerprint) {
      return res.status(400).json({ message: 'Blog ID, reaction type, and fingerprint are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    await Reaction.deleteOne({
      blogId,
      reactionType,
      fingerprint,
    });

    const reactions = await Reaction.getReactionCounts(blogId);

    res.json({
      message: 'Reaction removed',
      reactions,
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/reactions/:blogId/user/:fingerprint
 * @desc    Get user's reactions for a blog
 */
router.get('/:blogId/user/:fingerprint', async (req, res) => {
  try {
    const { blogId, fingerprint } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const userReactions = await Reaction.find({ blogId, fingerprint }).select('reactionType');

    res.json({
      userReactions: userReactions.map((r) => r.reactionType),
    });
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
