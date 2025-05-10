const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Reward Types
const RewardTypeEnum = [
  'HealthProduct', 
  'NutritionConsultation', 
  'FitnessClass', 
  'MealPlan', 
  'DigitalBadge', 
  'VirtualTrophy',
  'Discount',
  'ExclusiveContent'
];

// Reward Difficulty Levels
const RewardDifficultyEnum = [
  'Easy', 
  'Medium', 
  'Hard', 
  'Epic'
];

const RewardSchema = new mongoose.Schema({
  // System-wide reward template
  systemId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: RewardTypeEnum,
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: RewardDifficultyEnum,
    default: 'Easy'
  },
  requiredPoints: {
    type: Number,
    required: true,
    min: 1,
    max: 10000
  },
  redemptionCriteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  icon: {
    type: String,
    default: 'default-reward-icon.png'
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // 1 year from now
  },
  quantity: {
    type: Number,
    default: null // null means unlimited
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sponsoredBy: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound index for efficient querying
RewardSchema.index({ type: 1, difficultyLevel: 1, requiredPoints: 1 });

// Static method to create a new reward template
RewardSchema.statics.createTemplate = async function(rewardData) {
  const reward = new this({
    ...rewardData,
    systemId: uuidv4()
  });

  return reward.save();
};

// Static method to find rewards by type
RewardSchema.statics.findByType = async function(type, options = {}) {
  const { 
    page = 1, 
    limit = 20,
    minPoints = 0,
    maxPoints = 10000
  } = options;

  return this.find({ 
    type, 
    isActive: true,
    requiredPoints: { 
      $gte: minPoints, 
      $lte: maxPoints 
    }
  })
  .sort({ requiredPoints: 1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to validate reward redemption
RewardSchema.methods.validateRedemption = function(userPoints, userMetadata) {
  // Check points requirement
  if (userPoints < this.requiredPoints) {
    return {
      isValid: false,
      reason: 'Insufficient points'
    };
  }

  // Check additional redemption criteria
  if (this.redemptionCriteria) {
    for (const [key, requirement] of Object.entries(this.redemptionCriteria)) {
      const userValue = userMetadata[key];
      
      switch (typeof requirement) {
        case 'number':
          if (userValue < requirement) {
            return {
              isValid: false,
              reason: `Requirement not met: ${key}`
            };
          }
          break;
        case 'object':
          if (requirement.type === 'threshold' && userValue < requirement.value) {
            return {
              isValid: false,
              reason: `Threshold not met: ${key}`
            };
          }
          break;
      }
    }
  }

  // Check quantity and validity period
  if (this.quantity !== null && this.quantity <= 0) {
    return {
      isValid: false,
      reason: 'Reward no longer available'
    };
  }

  const now = new Date();
  if (now < this.validFrom || now > this.validUntil) {
    return {
      isValid: false,
      reason: 'Reward is not currently available'
    };
  }

  return {
    isValid: true
  };
};

module.exports = {
  Reward: mongoose.model('Reward', RewardSchema),
  RewardTypeEnum,
  RewardDifficultyEnum
};
