const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class AchievementService {
  // Create a new achievement template
  static async createAchievementTemplate(achievementData) {
    try {
      // Validate input
      if (!achievementData.title || !achievementData.description) {
        throw new ValidationError('Title and description are required');
      }

      const achievement = await Achievement.createTemplate(achievementData);
      return achievement;
    } catch (error) {
      throw error;
    }
  }

  // Track progress for a specific achievement
  static async trackAchievementProgress(userId, achievementId, progressData) {
    try {
      // Validate input
      if (!userId || !achievementId) {
        throw new ValidationError('User ID and Achievement ID are required');
      }

      const userAchievement = await UserAchievement.trackProgress(
        userId, 
        achievementId, 
        progressData
      );

      return userAchievement;
    } catch (error) {
      throw error;
    }
  }

  // Get available achievement templates
  static async getAchievementTemplates(options = {}) {
    try {
      const { 
        category, 
        difficultyLevel, 
        page = 1, 
        limit = 20 
      } = options;

      let query = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (difficultyLevel) {
        query.difficultyLevel = difficultyLevel;
      }

      const achievements = await Achievement.find(query)
        .sort({ points: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Achievement.countDocuments(query);

      return {
        achievements,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAchievements: total
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId, options = {}) {
    try {
      const userAchievements = await UserAchievement.getUserAchievements(
        userId, 
        options
      );

      return userAchievements;
    } catch (error) {
      throw error;
    }
  }

  // Generate recommended achievements
  static async generateRecommendedAchievements(userId) {
    try {
      // Get user's existing achievements and progress
      const { achievements: userAchievements } = await this.getUserAchievements(userId);

      // Get all available achievement templates
      const { achievements: allAchievements } = await this.getAchievementTemplates();

      // Filter out already completed achievements
      const recommendedAchievements = allAchievements.filter(achievement => 
        !userAchievements.some(ua => ua.achievement._id.equals(achievement._id))
      );

      // Sort by potential engagement and difficulty
      recommendedAchievements.sort((a, b) => b.points - a.points);

      return recommendedAchievements.slice(0, 5); // Top 5 recommendations
    } catch (error) {
      throw error;
    }
  }

  // Bulk create achievement templates
  static async bulkCreateAchievementTemplates(achievementsData) {
    try {
      const createdAchievements = await Promise.all(
        achievementsData.map(data => 
          Achievement.createTemplate(data)
        )
      );

      return createdAchievements;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AchievementService;
