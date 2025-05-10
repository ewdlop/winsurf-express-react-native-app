const mongoose = require('mongoose');

// Interaction Types
const InteractionTypeEnum = [
  'PageView', 
  'ButtonClick', 
  'FormSubmission', 
  'ContentInteraction', 
  'NavigationEvent', 
  'FeatureUsage',
  'SocialInteraction',
  'HealthTracking'
];

// Interaction Categories
const InteractionCategoryEnum = [
  'Authentication', 
  'Profile', 
  'HealthGoals', 
  'Nutrition', 
  'Fitness', 
  'Community', 
  'Rewards', 
  'Recommendations'
];

const UserInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: InteractionTypeEnum,
    required: true
  },
  category: {
    type: String,
    enum: InteractionCategoryEnum,
    required: true
  },
  feature: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  duration: {
    type: Number,
    default: 0 // interaction duration in milliseconds
  },
  device: {
    type: {
      type: String,
      enum: ['Mobile', 'Desktop', 'Tablet'],
      default: 'Mobile'
    },
    platform: {
      type: String,
      trim: true
    },
    browser: {
      type: String,
      trim: true
    }
  },
  location: {
    ip: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    }
  }
}, { timestamps: true });

// Compound index for efficient querying
UserInteractionSchema.index({ user: 1, type: 1, category: 1, createdAt: -1 });
UserInteractionSchema.index({ type: 1, category: 1, createdAt: -1 });

// Static method to log user interaction
UserInteractionSchema.statics.logInteraction = async function(interactionData) {
  try {
    const interaction = new this(interactionData);
    return interaction.save();
  } catch (error) {
    throw error;
  }
};

// Static method to get user interaction analytics
UserInteractionSchema.statics.getInteractionAnalytics = async function(options = {}) {
  const { 
    userId = null, 
    type = null, 
    category = null,
    startDate = new Date(0), 
    endDate = new Date(),
    page = 1, 
    limit = 50 
  } = options;

  const query = {
    createdAt: { 
      $gte: startDate, 
      $lte: endDate 
    }
  };

  if (userId) query.user = userId;
  if (type) query.type = type;
  if (category) query.category = category;

  // Aggregate interaction statistics
  const analytics = await this.aggregate([
    { $match: query },
    { 
      $group: {
        _id: {
          type: '$type',
          category: '$category',
          feature: '$feature'
        },
        totalInteractions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        type: '$_id.type',
        category: '$_id.category',
        feature: '$_id.feature',
        totalInteractions: 1,
        totalDuration: 1,
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { totalInteractions: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  ]);

  const total = await this.countDocuments(query);

  return {
    analytics,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalInteractions: total
  };
};

// Static method to analyze user engagement patterns
UserInteractionSchema.statics.analyzeEngagementPatterns = async function(userId) {
  const engagement = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        totalInteractions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        mostUsedFeatures: { 
          $push: { 
            feature: '$feature', 
            interactions: { $sum: 1 } 
          } 
        }
      }
    },
    {
      $project: {
        category: '$_id',
        totalInteractions: 1,
        totalDuration: 1,
        topFeatures: { 
          $slice: [
            { $sortArray: { 
              input: '$mostUsedFeatures', 
              sortBy: { interactions: -1 } 
            }}, 
            3 
          ]
        }
      }
    },
    { $sort: { totalInteractions: -1 } }
  ]);

  return engagement;
};

module.exports = {
  UserInteraction: mongoose.model('UserInteraction', UserInteractionSchema),
  InteractionTypeEnum,
  InteractionCategoryEnum
};
