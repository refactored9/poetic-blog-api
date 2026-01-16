const mongoose = require('mongoose');

const journeyImageSchema = new mongoose.Schema({
  id: String,
  url: String,
  caption: String,
  alt: String,
  location: String,
  takenAt: Date,
});

const journeySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
    images: [journeyImageSchema],
    location: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
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

// Virtual for id
journeySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Journey', journeySchema);
