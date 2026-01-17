const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: 'direct',
    },
    medium: {
      type: String,
    },
    campaign: {
      type: String,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
    },
    referrer: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
visitSchema.index({ createdAt: -1 });
visitSchema.index({ source: 1 });
visitSchema.index({ page: 1 });

// Virtual for id
visitSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Visit', visitSchema);
