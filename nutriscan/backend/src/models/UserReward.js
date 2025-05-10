const mongoose = require('mongoose');
const { Reward } = require('./Reward');
const SocialProfile = require('./SocialProfile');

const UserRewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  status: {
    type: String,
    enum: ['Earned', 'Redeemed', 'Expired'],
    default: 'Earned'
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound index for efficient querying
UserRewardSchema.index({ user: 1, status: 1 });

// Static method to earn a reward
UserRewardSchema.statics.earnReward = async function(userId, rewardId) {
  try {
    // Find the reward template
    const rewardTemplate = await Reward.findById(rewardId);
    if (!rewardTemplate) {
      throw new Error('Reward template not found');
    }

    // Find user's social profile to check points and metadata
    const socialProfile = await SocialProfile.findOne({ user: userId });
    if (!socialProfile) {
      throw new Error('User social profile not found');
    }

    // Validate reward redemption
    const validationResult = rewardTemplate.validateRedemption(
      socialProfile.socialStats.communityPoints, 
      socialProfile.metadata
    );

    if (!validationResult.isValid) {
      throw new Error(validationResult.reason);
    }

    // Create user reward entry
    const userReward = new this({
      user: userId,
      reward: rewardId,
      expiresAt: rewardTemplate.validUntil
    });

    // Reduce reward quantity if applicable
    if (rewardTemplate.quantity !== null) {
      rewardTemplate.quantity -= 1;
      await rewardTemplate.save();
    }

    // Update social profile
    await SocialProfile.findOneAndUpdate(
      { user: userId },
      { 
        $push: { 
          rewards: {
            title: rewardTemplate.title,
            type: rewardTemplate.type,
            points: rewardTemplate.requiredPoints
          }
        },
        $inc: { 
          'socialStats.totalRewards': 1 
        }
      }
    );

    return userReward.save();
  } catch (error) {
    throw error;
  }
};

// Static method to redeem a reward
UserRewardSchema.statics.redeemReward = async function(userId, userRewardId) {
  try {
    const userReward = await this.findOne({ 
      _id: userRewardId, 
      user: userId,
      status: 'Earned'
    }).populate('reward');

    if (!userReward) {
      throw new Error('Reward not found or already redeemed');
    }

    // Check reward expiration
    if (new Date() > userReward.expiresAt) {
      userReward.status = 'Expired';
      await userReward.save();
      throw new Error('Reward has expired');
    }

    // Update reward status
    userReward.status = 'Redeemed';
    userReward.redeemedAt = new Date();

    return userReward.save();
  } catch (error) {
    throw error;
  }
};

// Static method to get user's rewards
UserRewardSchema.statics.getUserRewards = async function(userId, options = {}) {
  const { 
    status = null, 
    page = 1, 
    limit = 20 
  } = options;

  const query = { user: userId };

  if (status) {
    query.status = status;
  }

  const userRewards = await this.find(query)
    .populate('reward')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    rewards: userRewards,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalRewards: total
  };
};

module.exports = mongoose.model('UserReward', UserRewardSchema);
