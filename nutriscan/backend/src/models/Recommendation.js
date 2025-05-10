const mongoose = require('mongoose');

// Recommendation Categories
const RecommendationCategoryEnum = [
  'Nutrition', 
  'Fitness', 
  'HealthGoals', 
  'MealPlan', 
  'Community', 
  'PersonalDevelopment',
  'WellnessTips',
  'ProductRecommendation'
];

// Recommendation Types
const RecommendationTypeEnum = [
  'Personalized', 
  'Generic', 
  'Contextual', 
  'Trending', 
  'Expert', 
  'CommunityBased',
  'MachineLearningDriven'
];

// Recommendation Confidence Levels
const ConfidenceLevelEnum = [
  'Low', 
  'Medium', 
  'High', 
  'VeryHigh'
];

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: RecommendationCategoryEnum,
    required: true
  },
  type: {
    type: String,
    enum: RecommendationTypeEnum,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  confidenceLevel: {
    type: String,
    enum: ConfidenceLevelEnum,
    default: 'Medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relevanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  actionItems: [{
    type: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    priority: {
      type: Number,
      default: 0
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  source: {
    type: {
      name: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['MachineLearning', 'Expert', 'Community', 'System']
      }
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
  }
}, { timestamps: true });

// Compound index for efficient querying
RecommendationSchema.index({ user: 1, category: 1, relevanceScore: -1 });
RecommendationSchema.index({ category: 1, relevanceScore: -1 });

// Static method to create recommendation
RecommendationSchema.statics.createRecommendation = async function(recommendationData) {
  try {
    const recommendation = new this(recommendationData);
    return recommendation.save();
  } catch (error) {
    throw error;
  }
};

// Static method to get personalized recommendations
RecommendationSchema.statics.getPersonalizedRecommendations = async function(userId, options = {}) {
  const { 
    category = null, 
    minRelevanceScore = 50,
    page = 1, 
    limit = 20 
  } = options;

  const query = {
    user: mongoose.Types.ObjectId(userId),
    relevanceScore: { $gte: minRelevanceScore },
    expiresAt: { $gt: new Date() }
  };

  if (category) query.category = category;

  const recommendations = await this.aggregate([
    { $match: query },
    { 
      $group: {
        _id: '$category',
        recommendations: { 
          $push: {
            _id: '$_id',
            title: '$title',
            description: '$description',
            relevanceScore: '$relevanceScore',
            confidenceLevel: '$confidenceLevel',
            actionItems: '$actionItems',
            tags: '$tags'
          }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        recommendations: { 
          $slice: ['$recommendations', limit] 
        }
      }
    },
    { $sort: { 'recommendations.relevanceScore': -1 } }
  ]);

  const total = await this.countDocuments(query);

  return {
    recommendations,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalRecommendations: total
  };
};

// Static method to generate contextual recommendations
RecommendationSchema.statics.generateContextualRecommendations = async function(userId, context) {
  try {
    const { 
      healthGoals, 
      dietaryPreferences, 
      fitnessLevel,
      recentActivities
    } = context;

    // Complex recommendation generation logic
    const recommendations = [];

    // Nutrition Recommendations
    if (dietaryPreferences) {
      recommendations.push({
        category: 'Nutrition',
        type: 'Contextual',
        title: 'Personalized Meal Plan',
        description: `Tailored meal plan based on your ${dietaryPreferences} diet`,
        relevanceScore: 85,
        confidenceLevel: 'High',
        actionItems: [
          { 
            type: 'MealPlanning', 
            description: 'Generate weekly meal plan', 
            priority: 1 
          }
        ]
      });
    }

    // Fitness Recommendations
    if (fitnessLevel) {
      recommendations.push({
        category: 'Fitness',
        type: 'Contextual',
        title: 'Custom Workout Plan',
        description: `Workout recommendations for ${fitnessLevel} fitness level`,
        relevanceScore: 80,
        confidenceLevel: 'High',
        actionItems: [
          { 
            type: 'WorkoutPlan', 
            description: 'Generate personalized workout routine', 
            priority: 1 
          }
        ]
      });
    }

    // Health Goal Recommendations
    if (healthGoals) {
      recommendations.push({
        category: 'HealthGoals',
        type: 'Contextual',
        title: 'Progress Boosters',
        description: `Strategies to accelerate your ${healthGoals} goals`,
        relevanceScore: 75,
        confidenceLevel: 'Medium',
        actionItems: [
          { 
            type: 'GoalTracking', 
            description: 'Set milestone checkpoints', 
            priority: 2 
          }
        ]
      });
    }

    // Bulk create recommendations
    const createdRecommendations = await this.insertMany(
      recommendations.map(rec => ({
        ...rec,
        user: userId
      }))
    );

    return createdRecommendations;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  Recommendation: mongoose.model('Recommendation', RecommendationSchema),
  RecommendationCategoryEnum,
  RecommendationTypeEnum,
  ConfidenceLevelEnum
};
