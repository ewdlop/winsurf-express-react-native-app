const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const HealthFocusEnum = [
  'Weight Loss', 
  'Muscle Gain', 
  'Nutrition', 
  'Cardiovascular Health', 
  'Diabetes Management', 
  'Athletic Performance'
];

const DietaryPreferencesEnum = [
  'Vegetarian', 
  'Vegan', 
  'Keto', 
  'Paleo', 
  'Gluten-Free', 
  'Low-Carb', 
  'Mediterranean'
];

const ConnectionTypeEnum = ['Friend', 'Follower', 'Following'];
const VisibilityEnum = ['Public', 'Friends', 'Private'];

const SocialProfileSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  profileId: { 
    type: String, 
    default: uuidv4, 
    unique: true 
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  bio: { 
    type: String, 
    maxlength: 500,
    trim: true
  },
  profilePicture: { 
    type: String,
    default: 'default-avatar.png'
  },
  coverImage: {
    type: String,
    default: 'default-cover.png'
  },
  healthFocus: {
    type: [String],
    enum: HealthFocusEnum
  },
  dietaryPreferences: {
    type: [String],
    enum: DietaryPreferencesEnum
  },
  socialConnections: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    connectionType: {
      type: String,
      enum: ConnectionTypeEnum,
      default: 'Friend'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: VisibilityEnum,
      default: 'Friends'
    },
    nutritionDataVisibility: {
      type: String,
      enum: VisibilityEnum,
      default: 'Private'
    }
  },
  communityRank: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for efficient querying
SocialProfileSchema.index({ user: 1, communityRank: -1 });

// Static method to add an achievement
SocialProfileSchema.statics.addAchievement = async function(userId, achievementData) {
  const profile = await this.findOne({ user: userId });
  
  if (!profile) {
    throw new Error('Social profile not found');
  }

  profile.achievements.push({
    title: achievementData.title,
    description: achievementData.description,
    points: achievementData.points || 10
  });

  // Update community rank based on achievements
  profile.communityRank = profile.achievements.reduce((total, achievement) => {
    return total + achievement.points;
  }, 0);

  return profile.save();
};

// Method to manage social connections
SocialProfileSchema.methods.manageSocialConnection = async function(targetUserId, connectionType = 'Friend') {
  const existingConnection = this.socialConnections.find(
    connection => connection.user.toString() === targetUserId.toString()
  );

  if (existingConnection) {
    // Update existing connection
    existingConnection.connectionType = connectionType;
  } else {
    // Add new connection
    this.socialConnections.push({
      user: targetUserId,
      connectionType
    });
  }

  return this.save();
};

// Virtual for profile completeness
SocialProfileSchema.virtual('profileCompleteness').get(function() {
  let completeness = 0;
  
  if (this.displayName) completeness += 20;
  if (this.bio) completeness += 15;
  if (this.profilePicture !== 'default-avatar.png') completeness += 15;
  if (this.healthFocus && this.healthFocus.length > 0) completeness += 20;
  if (this.dietaryPreferences && this.dietaryPreferences.length > 0) completeness += 20;
  if (this.achievements && this.achievements.length > 0) completeness += 10;

  return Math.min(completeness, 100);
});

module.exports = mongoose.model('SocialProfile', SocialProfileSchema);
