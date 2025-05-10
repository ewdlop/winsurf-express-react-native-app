const { 
  UserInteraction, 
  InteractionTypeEnum, 
  InteractionCategoryEnum 
} = require('../models/UserInteraction');
const SocialProfile = require('../models/SocialProfile');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class UserEngagementService {
  // Log user interaction
  static async logInteraction(userId, interactionData) {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      if (!InteractionTypeEnum.includes(interactionData.type)) {
        throw new ValidationError('Invalid interaction type');
      }

      if (!InteractionCategoryEnum.includes(interactionData.category)) {
        throw new ValidationError('Invalid interaction category');
      }

      const interaction = await UserInteraction.logInteraction({
        user: userId,
        ...interactionData
      });

      // Update social profile engagement stats
      await SocialProfile.findOneAndUpdate(
        { user: userId },
        { 
          $inc: { 
            'socialStats.totalInteractions': 1,
            [`socialStats.${interactionData.category.toLowerCase()}Interactions`]: 1
          }
        }
      );

      return interaction;
    } catch (error) {
      throw error;
    }
  }

  // Get interaction analytics
  static async getInteractionAnalytics(options = {}) {
    try {
      const analytics = await UserInteraction.getInteractionAnalytics(options);
      return analytics;
    } catch (error) {
      throw error;
    }
  }

  // Analyze user engagement patterns
  static async analyzeUserEngagement(userId) {
    try {
      const socialProfile = await SocialProfile.findOne({ user: userId });
      if (!socialProfile) {
        throw new NotFoundError('User social profile not found');
      }

      // Get engagement patterns
      const engagementPatterns = await UserInteraction.analyzeEngagementPatterns(userId);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(engagementPatterns);

      return {
        engagementPatterns,
        engagementScore,
        socialProfile: {
          communityPoints: socialProfile.socialStats.communityPoints,
          totalInteractions: socialProfile.socialStats.totalInteractions
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate personalized engagement recommendations
  static async generateEngagementRecommendations(userId) {
    try {
      const { engagementPatterns } = await this.analyzeUserEngagement(userId);

      // Identify low-engagement categories
      const lowEngagementCategories = engagementPatterns
        .filter(pattern => pattern.totalInteractions < 10)
        .map(pattern => pattern.category);

      // Generate recommendations based on low-engagement areas
      const recommendations = {
        lowEngagementAreas: lowEngagementCategories,
        suggestedFeatures: this.getSuggestedFeatures(lowEngagementCategories),
        motivationalTips: this.getMotivationalTips(lowEngagementCategories)
      };

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Calculate engagement score
  static calculateEngagementScore(engagementPatterns) {
    // Complex engagement scoring algorithm
    const totalInteractions = engagementPatterns.reduce(
      (sum, pattern) => sum + pattern.totalInteractions, 
      0
    );

    const categoryWeights = {
      'HealthGoals': 1.5,
      'Nutrition': 1.3,
      'Fitness': 1.3,
      'Community': 1.2,
      'Recommendations': 1.1,
      'Profile': 1.0,
      'Rewards': 1.0,
      'Authentication': 0.5
    };

    const weightedScore = engagementPatterns.reduce((score, pattern) => {
      const weight = categoryWeights[pattern.category] || 1.0;
      return score + (pattern.totalInteractions * weight);
    }, 0);

    // Normalize score
    const baselineScore = 100;
    const engagementScore = Math.min(
      Math.round((weightedScore / totalInteractions) * baselineScore), 
      baselineScore
    );

    return engagementScore;
  }

  // Get suggested features for low-engagement categories
  static getSuggestedFeatures(lowEngagementCategories) {
    const featureSuggestions = {
      'HealthGoals': [
        'Goal Tracking Wizard',
        'Progress Visualization',
        'Milestone Rewards'
      ],
      'Nutrition': [
        'Meal Plan Generator',
        'Nutritional Insights',
        'Recipe Recommendations'
      ],
      'Fitness': [
        'Workout Challenges',
        'Personal Training Sessions',
        'Fitness Tracking Integration'
      ],
      'Community': [
        'Social Challenges',
        'Group Discussions',
        'Peer Support Groups'
      ]
    };

    return lowEngagementCategories.reduce((suggestions, category) => {
      suggestions[category] = featureSuggestions[category] || [];
      return suggestions;
    }, {});
  }

  // Get motivational tips for low-engagement categories
  static getMotivationalTips(lowEngagementCategories) {
    const motivationalTips = {
      'HealthGoals': [
        'Small steps lead to big transformations!',
        'Every goal starts with a single decision.'
      ],
      'Nutrition': [
        'Fuel your body with purpose.',
        'Nutrition is the foundation of wellness.'
      ],
      'Fitness': [
        'Your body achieves what your mind believes.',
        'Consistency beats intensity every time.'
      ],
      'Community': [
        'Together, we are stronger.',
        'Shared goals create powerful connections.'
      ]
    };

    return lowEngagementCategories.reduce((tips, category) => {
      tips[category] = motivationalTips[category] || [];
      return tips;
    }, {});
  }
}

module.exports = UserEngagementService;
