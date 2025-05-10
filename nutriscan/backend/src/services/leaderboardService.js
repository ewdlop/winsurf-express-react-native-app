const { LeaderboardEntry, LeaderboardCategoryEnum } = require('../models/Leaderboard');
const SocialProfile = require('../models/SocialProfile');
const Achievement = require('../models/Achievement');
const HealthGoal = require('../models/HealthGoal');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class LeaderboardService {
  // Update leaderboard entry for a user
  static async updateLeaderboardEntry(userId, category, updateData) {
    try {
      // Validate input
      if (!userId || !category) {
        throw new ValidationError('User ID and Category are required');
      }

      if (!LeaderboardCategoryEnum.includes(category)) {
        throw new ValidationError('Invalid leaderboard category');
      }

      const leaderboardEntry = await LeaderboardEntry.updateEntry(
        userId, 
        category, 
        updateData
      );

      // Recalculate ranks after update
      await LeaderboardEntry.recalculateRanks(category);

      return leaderboardEntry;
    } catch (error) {
      throw error;
    }
  }

  // Get leaderboard for a specific category
  static async getLeaderboard(category, options = {}) {
    try {
      // Validate input
      if (!LeaderboardCategoryEnum.includes(category)) {
        throw new ValidationError('Invalid leaderboard category');
      }

      const leaderboard = await LeaderboardEntry.getLeaderboard(
        category, 
        options
      );

      return leaderboard;
    } catch (error) {
      throw error;
    }
  }

  // Sync leaderboard with user activities
  static async syncLeaderboard(userId) {
    try {
      // Fetch user's achievements
      const achievements = await Achievement.find({
        'userAchievements.user': userId,
        'userAchievements.isCompleted': true
      });

      // Fetch user's health goals
      const healthGoals = await HealthGoal.find({
        user: userId,
        status: 'Completed'
      });

      // Fetch user's social profile
      const socialProfile = await SocialProfile.findOne({ user: userId });

      // Update leaderboard entries for each category
      const leaderboardUpdates = LeaderboardCategoryEnum.map(async (category) => {
        let points = 0;
        let metadata = {};

        switch (category) {
          case 'Overall':
            points = socialProfile.socialStats.communityPoints;
            metadata = {
              totalAchievements: achievements.length,
              completedHealthGoals: healthGoals.length,
              communityContributions: socialProfile.socialStats.communityPoints
            };
            break;
          case 'Nutrition':
            points = achievements.filter(a => a.category === 'Nutrition')
              .reduce((total, achievement) => total + achievement.points, 0);
            break;
          case 'Fitness':
            points = achievements.filter(a => a.category === 'Fitness')
              .reduce((total, achievement) => total + achievement.points, 0);
            break;
          case 'Wellness':
            points = achievements.filter(a => a.category === 'Wellness')
              .reduce((total, achievement) => total + achievement.points, 0);
            break;
          case 'Community':
            points = achievements.filter(a => a.category === 'Community')
              .reduce((total, achievement) => total + achievement.points, 0);
            break;
          case 'Personal Growth':
            points = achievements.filter(a => a.category === 'Personal Growth')
              .reduce((total, achievement) => total + achievement.points, 0);
            break;
        }

        return this.updateLeaderboardEntry(userId, category, { 
          points,
          ...metadata
        });
      });

      return Promise.all(leaderboardUpdates);
    } catch (error) {
      throw error;
    }
  }

  // Get user's global and category-specific rankings
  static async getUserRankings(userId) {
    try {
      const rankings = await Promise.all(
        LeaderboardCategoryEnum.map(async (category) => {
          const leaderboard = await this.getLeaderboard(category, {
            includeUserRank: true,
            userId
          });

          return {
            category,
            rank: leaderboard.userRank,
            totalEntries: leaderboard.totalEntries
          };
        })
      );

      return rankings;
    } catch (error) {
      throw error;
    }
  }

  // Generate personalized leaderboard recommendations
  static async getPersonalizedLeaderboardRecommendations(userId) {
    try {
      // Get user's current rankings
      const userRankings = await this.getUserRankings(userId);

      // Find categories where user is far from top rankings
      const recommendedCategories = userRankings
        .filter(ranking => 
          ranking.rank > ranking.totalEntries * 0.5 // Bottom 50%
        )
        .map(ranking => ranking.category);

      // Fetch achievements in recommended categories
      const recommendedAchievements = await Achievement.find({
        category: { $in: recommendedCategories }
      }).limit(5);

      return {
        recommendedCategories,
        recommendedAchievements
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LeaderboardService;
