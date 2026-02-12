const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: 150,
  },
  bio: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  // Location & Areas
  location: {
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
  },
  areasOfOperation: [{
    type: String,
    trim: true,
  }],
  // Experience & Skills
  experienceYears: {
    type: Number,
    default: 0,
  },
  languages: [{
    type: String,
    trim: true,
  }],
  specializations: [{
    type: String,
    trim: true,
  }],
  // Contact Information
  contact: {
    email: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    instagram: { type: String },
    website: { type: String },
  },
  // Pricing
  priceRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' },
    unit: { type: String, default: 'per day' },
  },
  // Gallery
  galleryImages: [{
    url: { type: String, required: true },
    caption: { type: String },
    alt: { type: String },
  }],
  // Reviews & Ratings
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  // Highlights/Features
  highlights: [{
    icon: { type: String },
    title: { type: String, required: true },
    description: { type: String },
  }],
  // Availability
  isAvailable: {
    type: Boolean,
    default: true,
  },
  availabilityNote: {
    type: String,
  },
  // Status
  isPublished: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug from name before saving
guideSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.updatedAt = new Date();
  next();
});

// Index for searching
guideSchema.index({ name: 'text', bio: 'text', 'location.city': 'text', areasOfOperation: 'text' });

module.exports = mongoose.model('Guide', guideSchema);
