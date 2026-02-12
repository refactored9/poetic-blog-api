const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

/**
 * @route   GET /api/comments/:blogId
 * @desc    Get all approved comments for a blog
 */
router.get('/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;

    // Validate blogId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    // Get top-level comments with replies
    const comments = await Comment.find({
      blogId,
      parentId: null,
      isApproved: true,
    })
      .populate({
        path: 'replies',
        match: { isApproved: true },
        options: { sort: { createdAt: 1 } },
      })
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/comments
 * @desc    Create a new comment (auto-approved)
 */
router.post('/', async (req, res) => {
  try {
    const { blogId, parentId, name, email, content } = req.body;

    // Validate required fields
    if (!blogId || !name || !content) {
      return res.status(400).json({ message: 'Blog ID, name, and content are required' });
    }

    // Validate blogId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    // Validate parentId if provided
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: 'Invalid parent comment ID' });
    }

    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Get IP and user agent for spam prevention
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const comment = new Comment({
      blogId,
      parentId: parentId || null,
      name: name.trim(),
      email: email?.trim() || undefined,
      content: content.trim(),
      isApproved: true, // Auto-approve all comments
      ipAddress,
      userAgent,
    });

    const savedComment = await comment.save();

    res.status(201).json({
      message: 'Comment posted successfully',
      comment: savedComment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (admin only - no auth for simplicity)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({
      $or: [{ _id: id }, { parentId: id }],
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/comments/:id/approve
 * @desc    Approve or reject a comment (admin only)
 */
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment updated', comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/comments/admin/all
 * @desc    Get all comments for admin moderation
 */
router.get('/admin/all', async (req, res) => {
  try {
    const { status, blogId } = req.query;

    const filter = {};
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;
    if (blogId && mongoose.Types.ObjectId.isValid(blogId)) {
      filter.blogId = blogId;
    }

    const comments = await Comment.find(filter)
      .populate('blogId', 'title slug')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
