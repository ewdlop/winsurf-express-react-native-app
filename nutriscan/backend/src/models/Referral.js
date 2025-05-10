const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Referral Status Enum
const ReferralStatusEnum = [
  'Pending', 
  'Confirmed', 
  'Completed', 
  'Rejected'
];

// Referral Type Enum
const ReferralTypeEnum = [
  'UserReferral', 
  'AffiliateMarketing', 
  'PartnerProgram'
];

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    default: uuidv4
  },
  type: {
    type: String,
    enum: ReferralTypeEnum,
    default: 'UserReferral'
  },
  status: {
    type: String,
    enum: ReferralStatusEnum,
    default: 'Pending'
  },
  rewards: {
    referrerPoints: {
      type: Number,
      default: 0
    },
    referredUserPoints: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    referralChannel: {
      type: String,
      enum: ['Email', 'SMS', 'Social Media', 'Direct Link'],
      default: 'Direct Link'
    },
    trackingSource: {
      type: String,
      trim: true
    },
    campaignId: {
      type: String,
      trim: true
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Compound index for efficient querying
ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 }, { unique: true });

// Static method to generate unique referral code
ReferralSchema.statics.generateReferralCode = function() {
  return uuidv4().substr(0, 8).toUpperCase();
};

// Static method to create a new referral
ReferralSchema.statics.createReferral = async function(referrerId, options = {}) {
  const { 
    type = 'UserReferral', 
    metadata = {} 
  } = options;

  const referralCode = this.generateReferralCode();

  const referral = new this({
    referrer: referrerId,
    referralCode,
    type,
    metadata
  });

  return referral.save();
};

// Static method to validate and complete a referral
ReferralSchema.statics.completeReferral = async function(referralCode, referredUserId) {
  const referral = await this.findOne({ 
    referralCode, 
    status: 'Pending',
    expiresAt: { $gt: new Date() }
  });

  if (!referral) {
    throw new Error('Invalid or expired referral code');
  }

  // Update referral status
  referral.referredUser = referredUserId;
  referral.status = 'Completed';
  referral.completedAt = new Date();

  // Calculate and assign rewards
  referral.rewards = {
    referrerPoints: 100, // Base referrer points
    referredUserPoints: 50 // Base referred user points
  };

  return referral.save();
};

// Static method to get user's referrals
ReferralSchema.statics.getUserReferrals = async function(userId, options = {}) {
  const { 
    status = null, 
    page = 1, 
    limit = 20 
  } = options;

  const query = { referrer: userId };

  if (status) {
    query.status = status;
  }

  const referrals = await this.find(query)
    .populate('referredUser', 'username email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    referrals,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalReferrals: total
  };
};

module.exports = {
  Referral: mongoose.model('Referral', ReferralSchema),
  ReferralStatusEnum,
  ReferralTypeEnum
};
