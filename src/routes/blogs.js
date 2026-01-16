const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// @route   GET /api/blogs
// @desc    Get all blogs
router.get('/', async (req, res) => {
  try {
    const { published } = req.query;
    const filter = {};

    // If published query param is provided, filter by it
    if (published === 'true') {
      filter.isPublished = true;
    } else if (published === 'false') {
      filter.isPublished = false;
    }

    const blogs = await Blog.find(filter).sort({ publishedAt: -1 });
    res.json({ data: blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/blogs/:slug
// @desc    Get single blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ data: blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/blogs
// @desc    Create a new blog
router.post('/', async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, placeImages, author, isPublished, tags, featured } =
      req.body;

    const blog = new Blog({
      title,
      content,
      excerpt,
      coverImage,
      placeImages: placeImages || [],
      author: author || 'Anonymous',
      isPublished: isPublished || false,
      tags: tags || [],
      featured: featured || false,
      publishedAt: isPublished ? new Date() : undefined,
    });

    const savedBlog = await blog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog
router.put('/:id', async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, placeImages, author, isPublished, tags, featured } =
      req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (placeImages) blog.placeImages = placeImages;
    if (author) blog.author = author;
    if (isPublished !== undefined) {
      blog.isPublished = isPublished;
      if (isPublished && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    if (tags) blog.tags = tags;
    if (featured !== undefined) blog.featured = featured;

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
