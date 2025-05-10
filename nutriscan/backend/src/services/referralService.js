const { Referral, ReferralTypeEnum } = require('../models/Referral');
const SocialProfile = require('../models/SocialProfile');
const User = require('../models/User');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class ReferralService {
  // Create a new referral for a user
  static async createReferral(userId, options = {}) {
    try {
      // Validate input
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { 
        type = 'UserReferral', 
        metadata = {} 
      } = options;

      // Validate referral type
      if (!ReferralTypeEnum.includes(type)) {
        throw new ValidationError('Invalid referral type');
      }

      // Create referral
      const referral = await Referral.createReferral(userId, { 
        type, 
        metadata 
      });

      return referral;
    } catch (error) {
      throw error;
    }
  }

  // Complete a referral when a new user signs up
  static async completeReferral(referralCode, referredUserId) {
    try {
      // Complete referral
      const referral = await Referral.completeReferral(referralCode, referredUserId);

      // Update social profiles with referral rewards
      const referrerProfile = await SocialProfile.findOneAndUpdate(
        { user: referral.referrer },
        { 
          $inc: { 
            'socialStats.communityPoints': referral.rewards.referrerPoints,
            'socialStats.totalReferrals': 1
          }
        }
      );

      const referredUserProfile = await SocialProfile.findOneAndUpdate(
        { user: referredUserId },
        { 
          $inc: { 
            'socialStats.communityPoints': referral.rewards.referredUserPoints 
          }
        }
      );

      return {
        referral,
        referrerProfile,
        referredUserProfile
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user's referrals
  static async getUserReferrals(userId, options = {}) {
    try {
      const userReferrals = await Referral.getUserReferrals(
        userId, 
        options
      );

      return userReferrals;
    } catch (error) {
      throw error;
    }
  }

  // Generate referral statistics
  static async getReferralStatistics(userId) {
    try {
      const socialProfile = await SocialProfile.findOne({ user: userId });
      if (!socialProfile) {
        throw new NotFoundError('User social profile not found');
      }

      // Get total referrals
      const { totalReferrals } = socialProfile.socialStats;

      // Get referrals by status
      const referralStatusStats = await Referral.aggregate([
        { $match: { referrer: mongoose.Types.ObjectId(userId) } },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        }
      ]);

      // Calculate potential earnings
      const potentialPoints = totalReferrals * 100; // 100 points per referral

      return {
        totalReferrals,
        referralStatusStats,
        potentialPoints
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate personalized referral recommendations
  static async generateReferralRecommendations(userId) {
    try {
      const socialProfile = await SocialProfile.findOne({ user: userId });
      if (!socialProfile) {
        throw new NotFoundError('User social profile not found');
      }

      // Analyze user's network and engagement
      const recommendations = {
        socialMediaSharing: {
          platforms: ['Facebook', 'Twitter', 'LinkedIn'],
          potentialReach: socialProfile.socialStats.connections * 10
        },
        emailInvites: {
          maxInvites: 50,
          potentialRewards: 500
        },
        communityEngagement: {
          recommendedChannels: [
            'Community Feed',
            'Health Goal Groups',
            'Fitness Challenges'
          ]
        }
      };

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Create affiliate marketing referral
  static async createAffiliateReferral(userId, affiliateData) {
    try {
      const { 
        campaignId, 
        trackingSource 
      } = affiliateData;

      const referral = await this.createReferral(userId, {
        type: 'AffiliateMarketing',
        metadata: {
          campaignId,
          trackingSource
        }
      });

      return referral;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ReferralService;
