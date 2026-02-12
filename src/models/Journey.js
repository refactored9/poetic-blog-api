const mongoose = require('mongoose');

const journeyImageSchema = new mongoose.Schema({
  id: String,
  url: String,
  caption: String,
  alt: String,
  location: String,
  takenAt: Date,
});

// Route stop/waypoint schema for hiking maps
const routeStopSchema = new mongoose.Schema({
  id: String,
  name: {
    type: String,
    required: true,
  },
  description: String,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  type: {
    type: String,
    enum: ['start', 'stop', 'viewpoint', 'campsite', 'water', 'food', 'danger', 'end', 'poi'],
    default: 'stop',
  },
  elevation: Number, // in meters
  order: { type: Number, default: 0 },
  images: [String], // URLs of images at this stop
});

// Route/Trail schema for hiking maps
const routeSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  name: String,
  description: String,
  // Route path as array of coordinates
  path: [{
    lat: Number,
    lng: Number,
  }],
  stops: [routeStopSchema],
  // Route metadata
  distance: Number, // in kilometers
  duration: String, // estimated time e.g., "4-5 hours"
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'difficult', 'expert'],
  },
  elevationGain: Number, // in meters
  elevationLoss: Number, // in meters
  minElevation: Number,
  maxElevation: Number,
  // Map settings
  mapCenter: {
    lat: Number,
    lng: Number,
  },
  mapZoom: { type: Number, default: 13 },
  // Trail type
  trailType: {
    type: String,
    enum: ['loop', 'out-and-back', 'point-to-point', 'network'],
  },
  // Best time to visit
  bestSeason: [String],
  // Warnings/Notes
  warnings: [String],
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
    // Hiking route/map data
    route: routeSchema,
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
