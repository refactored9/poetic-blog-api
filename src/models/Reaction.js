const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    reactionType: {
      type: String,
      required: true,
      enum: ['love', 'clap', 'fire', 'insightful', 'touching'],
    },
    fingerprint: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique reactions per user per blog
reactionSchema.index({ blogId: 1, reactionType: 1, fingerprint: 1 }, { unique: true });

// Index for aggregation queries
reactionSchema.index({ blogId: 1, reactionType: 1 });

// Static method to get reaction counts for a blog
reactionSchema.statics.getReactionCounts = async function (blogId) {
  const results = await this.aggregate([
    { $match: { blogId: new mongoose.Types.ObjectId(blogId) } },
    { $group: { _id: '$reactionType', count: { $sum: 1 } } },
  ]);

  const counts = {};
  results.forEach((r) => {
    counts[r._id] = r.count;
  });

  return counts;
};

module.exports = mongoose.model('Reaction', reactionSchema);
