const SocialProfile = require('../models/SocialProfile');
const User = require('../models/User');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class SocialProfileService {
  // Create or update social profile
  static async createOrUpdateProfile(userId, profileData) {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Find or create social profile
      let socialProfile = await SocialProfile.findOne({ user: userId });

      if (socialProfile) {
        // Update existing profile
        socialProfile = await SocialProfile.findOneAndUpdate(
          { user: userId },
          { 
            ...profileData,
            $inc: { 'socialStats.profileUpdates': 1 }
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new profile
        socialProfile = new SocialProfile({
          user: userId,
          ...profileData
        });
        await socialProfile.save();
      }

      return socialProfile;
    } catch (error) {
      throw error;
    }
  }

  // Get social profile by user ID
  static async getProfileByUserId(userId) {
    try {
      const socialProfile = await SocialProfile.findOne({ user: userId })
        .populate('user', 'username email')
        .populate('connections.user', 'username profilePicture');

      if (!socialProfile) {
        throw new NotFoundError('Social profile not found');
      }

      return socialProfile;
    } catch (error) {
      throw error;
    }
  }

  // Add connection
  static async addConnection(userId, connectionId) {
    try {
      // Validate input
      if (!userId || !connectionId) {
        throw new ValidationError('User ID and Connection ID are required');
      }

      // Check if both users exist
      const [user, connectionUser] = await Promise.all([
        User.findById(userId),
        User.findById(connectionId)
      ]);

      if (!user || !connectionUser) {
        throw new NotFoundError('One or both users not found');
      }

      // Update both users' social profiles
      const [userProfile, connectionProfile] = await Promise.all([
        SocialProfile.findOneAndUpdate(
          { user: userId },
          { 
            $addToSet: { 
              connections: { 
                user: connectionId, 
                status: 'pending' 
              } 
            },
            $inc: { 'socialStats.totalConnections': 1 }
          },
          { new: true }
        ),
        SocialProfile.findOneAndUpdate(
          { user: connectionId },
          { 
            $addToSet: { 
              connections: { 
                user: userId, 
                status: 'pending' 
              } 
            },
            $inc: { 'socialStats.totalConnections': 1 }
          },
          { new: true }
        )
      ]);

      return { userProfile, connectionProfile };
    } catch (error) {
      throw error;
    }
  }

  // Accept connection request
  static async acceptConnectionRequest(userId, connectionId) {
    try {
      // Update connection status for both users
      const [userProfile, connectionProfile] = await Promise.all([
        SocialProfile.findOneAndUpdate(
          { user: userId, 'connections.user': connectionId },
          { 
            $set: { 'connections.$.status': 'accepted' },
            $inc: { 'socialStats.communityPoints': 10 }
          },
          { new: true }
        ),
        SocialProfile.findOneAndUpdate(
          { user: connectionId, 'connections.user': userId },
          { 
            $set: { 'connections.$.status': 'accepted' },
            $inc: { 'socialStats.communityPoints': 10 }
          },
          { new: true }
        )
      ]);

      return { userProfile, connectionProfile };
    } catch (error) {
      throw error;
    }
  }

  // Remove connection
  static async removeConnection(userId, connectionId) {
    try {
      const [userProfile, connectionProfile] = await Promise.all([
        SocialProfile.findOneAndUpdate(
          { user: userId },
          { 
            $pull: { connections: { user: connectionId } },
            $inc: { 
              'socialStats.totalConnections': -1,
              'socialStats.communityPoints': -5 
            }
          },
          { new: true }
        ),
        SocialProfile.findOneAndUpdate(
          { user: connectionId },
          { 
            $pull: { connections: { user: userId } },
            $inc: { 
              'socialStats.totalConnections': -1,
              'socialStats.communityPoints': -5 
            }
          },
          { new: true }
        )
      ]);

      return { userProfile, connectionProfile };
    } catch (error) {
      throw error;
    }
  }

  // Update community rank
  static async updateCommunityRank(userId) {
    try {
      const socialProfile = await SocialProfile.findOne({ user: userId });

      if (!socialProfile) {
        throw new NotFoundError('Social profile not found');
      }

      const communityPoints = socialProfile.socialStats.communityPoints;
      let newRank = 'Novice';

      if (communityPoints >= 500) newRank = 'Champion';
      else if (communityPoints >= 250) newRank = 'Expert';
      else if (communityPoints >= 100) newRank = 'Enthusiast';

      socialProfile.socialStats.communityRank = newRank;
      await socialProfile.save();

      return socialProfile;
    } catch (error) {
      throw error;
    }
  }

  // Search users
  static async searchUsers(query) {
    try {
      const socialProfiles = await SocialProfile.find({
        $or: [
          { displayName: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('user', 'username email')
      .limit(20);

      return socialProfiles;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SocialProfileService;
