const mongoose = require('mongoose');
const Achievement = require('./Achievement');
const SocialProfile = require('./SocialProfile');

const UserAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound index for efficient querying
UserAchievementSchema.index({ user: 1, isCompleted: 1 });

// Static method to track achievement progress
UserAchievementSchema.statics.trackProgress = async function(userId, achievementId, progressData) {
  let userAchievement = await this.findOne({ 
    user: userId, 
    achievement: achievementId 
  });

  if (!userAchievement) {
    userAchievement = new this({
      user: userId,
      achievement: achievementId,
      progress: progressData
    });
  } else {
    // Update progress
    userAchievement.progress = {
      ...userAchievement.progress,
      ...progressData
    };
  }

  // Check if achievement is completed
  const achievementTemplate = await Achievement.findById(achievementId);
  const isCompleted = checkAchievementCompletion(
    achievementTemplate.criteria, 
    userAchievement.progress
  );

  if (isCompleted && !userAchievement.isCompleted) {
    userAchievement.isCompleted = true;
    userAchievement.completedAt = new Date();

    // Update social profile with achievement points
    await SocialProfile.findOneAndUpdate(
      { user: userId },
      { 
        $push: { 
          achievements: {
            title: achievementTemplate.title,
            description: achievementTemplate.description,
            points: achievementTemplate.points
          }
        },
        $inc: { 
          'socialStats.communityPoints': achievementTemplate.points,
          'socialStats.totalAchievements': 1
        }
      }
    );
  }

  return userAchievement.save();
};

// Helper function to check achievement completion
function checkAchievementCompletion(criteria, progress) {
  // Implement complex achievement completion logic
  for (const [key, requirement] of Object.entries(criteria)) {
    const currentProgress = progress[key] || 0;
    
    switch (typeof requirement) {
      case 'number':
        if (currentProgress < requirement) return false;
        break;
      case 'object':
        if (requirement.type === 'threshold') {
          if (currentProgress < requirement.value) return false;
        }
        break;
    }
  }
  
  return true;
}

// Method to get user's achievements
UserAchievementSchema.statics.getUserAchievements = async function(userId, options = {}) {
  const { 
    completed = null, 
    category = null,
    page = 1, 
    limit = 20 
  } = options;

  const query = { user: userId };

  if (completed !== null) {
    query.isCompleted = completed;
  }

  if (category) {
    const achievementsInCategory = await Achievement.find({ category });
    query.achievement = { $in: achievementsInCategory.map(a => a._id) };
  }

  const userAchievements = await this.find(query)
    .populate('achievement')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    achievements: userAchievements,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalAchievements: total
  };
};

module.exports = mongoose.model('UserAchievement', UserAchievementSchema);
