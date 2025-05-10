const { Reward, RewardTypeEnum } = require('../models/Reward');
const UserReward = require('../models/UserReward');
const SocialProfile = require('../models/SocialProfile');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class RewardsService {
  // Create a new reward template
  static async createRewardTemplate(rewardData) {
    try {
      // Validate input
      if (!rewardData.title || !rewardData.description) {
        throw new ValidationError('Title and description are required');
      }

      const reward = await Reward.createTemplate(rewardData);
      return reward;
    } catch (error) {
      throw error;
    }
  }

  // Get available reward templates
  static async getRewardTemplates(options = {}) {
    try {
      const { 
        type = null, 
        minPoints = 0,
        maxPoints = 10000,
        page = 1, 
        limit = 20 
      } = options;

      const query = { 
        isActive: true,
        requiredPoints: { 
          $gte: minPoints, 
          $lte: maxPoints 
        }
      };

      if (type && RewardTypeEnum.includes(type)) {
        query.type = type;
      }

      const rewards = await Reward.find(query)
        .sort({ requiredPoints: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Reward.countDocuments(query);

      return {
        rewards,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRewards: total
      };
    } catch (error) {
      throw error;
    }
  }

  // Earn a reward
  static async earnReward(userId, rewardId) {
    try {
      const userReward = await UserReward.earnReward(userId, rewardId);
      return userReward;
    } catch (error) {
      throw error;
    }
  }

  // Redeem a reward
  static async redeemReward(userId, userRewardId) {
    try {
      const userReward = await UserReward.redeemReward(userId, userRewardId);
      return userReward;
    } catch (error) {
      throw error;
    }
  }

  // Get user's rewards
  static async getUserRewards(userId, options = {}) {
    try {
      const userRewards = await UserReward.getUserRewards(
        userId, 
        options
      );

      return userRewards;
    } catch (error) {
      throw error;
    }
  }

  // Generate recommended rewards
  static async generateRecommendedRewards(userId) {
    try {
      // Find user's social profile
      const socialProfile = await SocialProfile.findOne({ user: userId });
      if (!socialProfile) {
        throw new NotFoundError('User social profile not found');
      }

      // Get user's current community points
      const userPoints = socialProfile.socialStats.communityPoints;

      // Get all available reward templates
      const { rewards: allRewards } = await this.getRewardTemplates({
        minPoints: 0,
        maxPoints: userPoints + 1000 // Include slightly higher point rewards
      });

      // Filter rewards user can potentially earn
      const recommendedRewards = allRewards.filter(reward => 
        reward.requiredPoints <= userPoints
      );

      // Sort by points (closest to user's current points)
      recommendedRewards.sort((a, b) => 
        Math.abs(a.requiredPoints - userPoints) - 
        Math.abs(b.requiredPoints - userPoints)
      );

      return recommendedRewards.slice(0, 5); // Top 5 recommendations
    } catch (error) {
      throw error;
    }
  }

  // Bulk create reward templates
  static async bulkCreateRewardTemplates(rewardsData) {
    try {
      const createdRewards = await Promise.all(
        rewardsData.map(data => 
          Reward.createTemplate(data)
        )
      );

      return createdRewards;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RewardsService;
