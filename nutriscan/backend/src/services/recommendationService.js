const { 
  Recommendation, 
  RecommendationCategoryEnum, 
  RecommendationTypeEnum 
} = require('../models/Recommendation');
const User = require('../models/User');
const HealthGoal = require('../models/HealthGoal');
const MealPlan = require('../models/MealPlan');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class RecommendationService {
  // Create a recommendation
  static async createRecommendation(userId, recommendationData) {
    try {
      // Validate input
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Validate recommendation category and type
      if (!RecommendationCategoryEnum.includes(recommendationData.category)) {
        throw new ValidationError('Invalid recommendation category');
      }

      if (!RecommendationTypeEnum.includes(recommendationData.type)) {
        throw new ValidationError('Invalid recommendation type');
      }

      const recommendation = await Recommendation.createRecommendation({
        user: userId,
        ...recommendationData
      });

      return recommendation;
    } catch (error) {
      throw error;
    }
  }

  // Get personalized recommendations
  static async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const recommendations = await Recommendation.getPersonalizedRecommendations(
        userId, 
        options
      );

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Generate contextual recommendations
  static async generateContextualRecommendations(userId) {
    try {
      // Fetch user's context
      const user = await User.findById(userId).populate([
        'socialProfile', 
        'healthGoals', 
        'dietaryPreferences'
      ]);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Gather contextual information
      const context = {
        healthGoals: user.healthGoals.map(goal => goal.type),
        dietaryPreferences: user.socialProfile.dietaryPreferences,
        fitnessLevel: user.socialProfile.fitnessLevel,
        recentActivities: await this.getRecentUserActivities(userId)
      };

      // Generate contextual recommendations
      const recommendations = await Recommendation.generateContextualRecommendations(
        userId, 
        context
      );

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Get recent user activities
  static async getRecentUserActivities(userId) {
    try {
      // Fetch recent health goals
      const recentHealthGoals = await HealthGoal.find({ 
        user: userId, 
        status: 'Active' 
      }).sort({ createdAt: -1 }).limit(5);

      // Fetch recent meal plans
      const recentMealPlans = await MealPlan.find({ 
        user: userId 
      }).sort({ createdAt: -1 }).limit(5);

      return {
        healthGoals: recentHealthGoals,
        mealPlans: recentMealPlans
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate machine learning-driven recommendations
  static async generateMLDrivenRecommendations(userId) {
    try {
      // Simulate ML recommendation generation
      const mlRecommendations = [
        {
          category: 'Nutrition',
          type: 'MachineLearningDriven',
          title: 'Optimized Nutrition Plan',
          description: 'AI-powered nutrition recommendations based on your health data',
          relevanceScore: 90,
          confidenceLevel: 'VeryHigh',
          actionItems: [
            { 
              type: 'NutritionOptimization', 
              description: 'Adjust macronutrient balance', 
              priority: 1 
            }
          ],
          metadata: {
            aiConfidence: 0.85,
            dataPoints: ['metabolic rate', 'body composition', 'activity level']
          }
        },
        {
          category: 'Fitness',
          type: 'MachineLearningDriven',
          title: 'Adaptive Workout Strategy',
          description: 'Dynamic workout plan that evolves with your progress',
          relevanceScore: 85,
          confidenceLevel: 'High',
          actionItems: [
            { 
              type: 'WorkoutAdaptation', 
              description: 'Modify workout intensity', 
              priority: 2 
            }
          ],
          metadata: {
            aiConfidence: 0.75,
            dataPoints: ['workout history', 'recovery rate', 'performance metrics']
          }
        }
      ];

      // Bulk create ML recommendations
      const createdRecommendations = await Recommendation.insertMany(
        mlRecommendations.map(rec => ({
          ...rec,
          user: userId
        }))
      );

      return createdRecommendations;
    } catch (error) {
      throw error;
    }
  }

  // Recommendation feedback and learning
  static async processRecommendationFeedback(userId, recommendationId, feedback) {
    try {
      const { 
        rating, 
        actionTaken, 
        comments 
      } = feedback;

      // Update recommendation based on user feedback
      const recommendation = await Recommendation.findOneAndUpdate(
        { _id: recommendationId, user: userId },
        {
          $set: {
            'metadata.userFeedback': {
              rating,
              actionTaken,
              comments,
              timestamp: new Date()
            }
          },
          $inc: {
            relevanceScore: rating > 3 ? 5 : -5
          }
        },
        { new: true }
      );

      if (!recommendation) {
        throw new NotFoundError('Recommendation not found');
      }

      return recommendation;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RecommendationService;
