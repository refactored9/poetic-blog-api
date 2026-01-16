const mongoose = require('mongoose');
const slugify = require('slugify');

const placeImageSchema = new mongoose.Schema({
  id: String,
  url: String,
  caption: String,
  alt: String,
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      type: String,
    },
    placeImages: [placeImageSchema],
    author: {
      type: String,
      default: 'Anonymous',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    readingTime: {
      type: Number,
      default: 1,
    },
    tags: [String],
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug before saving
blogSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  // Generate excerpt if not provided
  if (this.isModified('content') && !this.excerpt) {
    // Strip any markdown/html and get first 150 chars
    const plainText = this.content.replace(/[#*_~`>\[\]()]/g, '').trim();
    this.excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }

  next();
});

// Virtual for id
blogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Blog', blogSchema);
