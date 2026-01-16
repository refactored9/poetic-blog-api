const express = require('express');
const router = express.Router();
const About = require('../models/About');

// @route   GET /api/about
// @desc    Get about info
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();

    // Create default if none exists
    if (!about) {
      about = await About.create({
        name: 'Your Name',
        tagline: 'Writer & Traveler',
        bio: 'Tell your story here...',
      });
    }

    res.json({ data: about });
  } catch (error) {
    console.error('Error fetching about:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/about
// @desc    Update about info
router.put('/', async (req, res) => {
  try {
    const {
      name,
      tagline,
      profileImage,
      bio,
      story,
      location,
      email,
      socialLinks,
      resumeUrl,
    } = req.body;

    let about = await About.findOne();

    if (!about) {
      about = new About();
    }

    if (name !== undefined) about.name = name;
    if (tagline !== undefined) about.tagline = tagline;
    if (profileImage !== undefined) about.profileImage = profileImage;
    if (bio !== undefined) about.bio = bio;
    if (story !== undefined) about.story = story;
    if (location !== undefined) about.location = location;
    if (email !== undefined) about.email = email;
    if (socialLinks !== undefined) about.socialLinks = socialLinks;
    if (resumeUrl !== undefined) about.resumeUrl = resumeUrl;

    const updatedAbout = await about.save();
    res.json({ data: updatedAbout });
  } catch (error) {
    console.error('Error updating about:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
