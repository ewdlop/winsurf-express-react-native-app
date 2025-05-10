const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Achievement Categories
const AchievementCategoryEnum = [
  'Nutrition', 
  'Fitness', 
  'Wellness', 
  'Community', 
  'Personal Growth'
];

// Difficulty Levels
const DifficultyLevelEnum = [
  'Bronze', 
  'Silver', 
  'Gold', 
  'Platinum', 
  'Diamond'
];

const AchievementSchema = new mongoose.Schema({
  // System-wide achievement template
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
  category: {
    type: String,
    enum: AchievementCategoryEnum,
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: DifficultyLevelEnum,
    default: 'Bronze'
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  icon: {
    type: String,
    default: 'default-achievement-icon.png'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index for efficient querying
AchievementSchema.index({ category: 1, difficultyLevel: 1 });

// Static method to create a new achievement template
AchievementSchema.statics.createTemplate = async function(achievementData) {
  const achievement = new this({
    ...achievementData,
    systemId: uuidv4()
  });

  return achievement.save();
};

// Static method to find achievements by category
AchievementSchema.statics.findByCategory = async function(category) {
  return this.find({ 
    category, 
    isActive: true 
  });
};

// Static method to find achievements by difficulty level
AchievementSchema.statics.findByDifficultyLevel = async function(difficultyLevel) {
  return this.find({ 
    difficultyLevel, 
    isActive: true 
  });
};

module.exports = mongoose.model('Achievement', AchievementSchema);
