const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  icon: String,
});

const aboutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Your Name',
    },
    tagline: {
      type: String,
      default: 'Writer & Traveler',
    },
    profileImage: {
      type: String,
    },
    bio: {
      type: String,
      default: '',
    },
    story: {
      type: String,
      default: '',
    },
    location: {
      type: String,
    },
    email: {
      type: String,
    },
    socialLinks: [socialLinkSchema],
    resumeUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

aboutSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('About', aboutSchema);
