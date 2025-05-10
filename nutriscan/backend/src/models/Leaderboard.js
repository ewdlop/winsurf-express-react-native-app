const mongoose = require('mongoose');

// Leaderboard Categories
const LeaderboardCategoryEnum = [
  'Overall', 
  'Nutrition', 
  'Fitness', 
  'Wellness', 
  'Community', 
  'Personal Growth'
];

const LeaderboardEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: LeaderboardCategoryEnum,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  metadata: {
    totalAchievements: {
      type: Number,
      default: 0
    },
    completedHealthGoals: {
      type: Number,
      default: 0
    },
    communityContributions: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

// Compound index for efficient querying
LeaderboardEntrySchema.index({ category: 1, points: -1 });

// Static method to update leaderboard entry
LeaderboardEntrySchema.statics.updateEntry = async function(userId, category, updateData) {
  const leaderboardEntry = await this.findOneAndUpdate(
    { user: userId, category },
    { 
      $inc: { 
        points: updateData.points || 0,
        'metadata.totalAchievements': updateData.achievements || 0,
        'metadata.completedHealthGoals': updateData.healthGoals || 0,
        'metadata.communityContributions': updateData.communityContributions || 0
      }
    },
    { 
      new: true, 
      upsert: true 
    }
  );

  return leaderboardEntry;
};

// Static method to recalculate ranks for a category
LeaderboardEntrySchema.statics.recalculateRanks = async function(category) {
  const entries = await this.find({ category })
    .sort({ points: -1 })
    .populate('user', 'username profilePicture');

  const rankedEntries = entries.map((entry, index) => {
    entry.rank = index + 1;
    return entry.save();
  });

  return Promise.all(rankedEntries);
};

// Static method to get leaderboard
LeaderboardEntrySchema.statics.getLeaderboard = async function(category, options = {}) {
  const { 
    page = 1, 
    limit = 50, 
    includeUserRank = false,
    userId = null 
  } = options;

  const query = { category };

  const totalEntries = await this.countDocuments(query);

  const leaderboard = await this.find(query)
    .sort({ points: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'username profilePicture socialProfile');

  // Optional: Include user's rank if provided
  let userRank = null;
  if (includeUserRank && userId) {
    const userEntry = await this.findOne({ user: userId, category });
    if (userEntry) {
      userRank = userEntry.rank;
    }
  }

  return {
    entries: leaderboard,
    currentPage: page,
    totalPages: Math.ceil(totalEntries / limit),
    totalEntries,
    userRank
  };
};

const LeaderboardEntry = mongoose.model('LeaderboardEntry', LeaderboardEntrySchema);

module.exports = {
  LeaderboardEntry,
  LeaderboardCategoryEnum
};
