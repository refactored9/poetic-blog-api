const mongoose = require('mongoose');

const gearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['camera', 'lens', 'audio', 'laptop', 'accessories', 'travel', 'other'],
      default: 'other',
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    amazonUrl: {
      type: String,
    },
    price: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

gearSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Gear', gearSchema);
