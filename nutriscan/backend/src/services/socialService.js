const SocialProfile = require('../models/SocialProfile');
const CommunityFeed = require('../models/CommunityFeed');
const User = require('../models/User');
const logger = require('../utils/logger');

class SocialService {
  // Create or update social profile
  async createOrUpdateProfile(userId, profileData) {
    try {
      let socialProfile = await SocialProfile.findOne({ user: userId });

      if (!socialProfile) {
        socialProfile = new SocialProfile({
          user: userId,
          ...profileData
        });
      } else {
        Object.assign(socialProfile, profileData);
      }

      await socialProfile.save();
      logger.info(`Social profile updated for user ${userId}`);
      return socialProfile;
    } catch (error) {
      logger.error('Error creating/updating social profile', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Find and connect with other users
  async findUsers(searchParams) {
    try {
      const { 
        healthFocus, 
        dietaryPreferences, 
        communityRankMin, 
        displayName 
      } = searchParams;

      const query = {};

      if (healthFocus) {
        query['healthFocus'] = { $in: healthFocus };
      }

      if (dietaryPreferences) {
        query['dietaryPreferences'] = { $in: dietaryPreferences };
      }

      if (communityRankMin) {
        query['communityRank'] = { $gte: communityRankMin };
      }

      if (displayName) {
        query['displayName'] = { $regex: displayName, $options: 'i' };
      }

      const users = await SocialProfile.find(query)
        .populate('user', 'email')
        .sort({ communityRank: -1 })
        .limit(50);

      return users;
    } catch (error) {
      logger.error('Error finding users', { 
        searchParams, 
        error: error.message 
      });
      throw error;
    }
  }

  // Manage social connections
  async manageSocialConnection(currentUserId, targetUserId, connectionType = 'Friend') {
    try {
      const currentUserProfile = await SocialProfile.findOne({ user: currentUserId });
      const targetUserProfile = await SocialProfile.findOne({ user: targetUserId });

      if (!currentUserProfile || !targetUserProfile) {
        throw new Error('One or both user profiles not found');
      }

      await currentUserProfile.manageSocialConnection(targetUserId, connectionType);
      await targetUserProfile.manageSocialConnection(currentUserId, connectionType);

      logger.info(`Social connection established between ${currentUserId} and ${targetUserId}`);
      return currentUserProfile;
    } catch (error) {
      logger.error('Error managing social connection', { 
        currentUserId, 
        targetUserId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Create a community feed post
  async createCommunityPost(postData) {
    try {
      const post = await CommunityFeed.createPost(postData);
      
      // Add achievement for creating a post
      await SocialProfile.addAchievement(postData.authorId, {
        title: 'Community Contributor',
        description: 'Shared a post in the community',
        points: 15
      });

      logger.info(`Community post created by user ${postData.authorId}`);
      return post;
    } catch (error) {
      logger.error('Error creating community post', { 
        postData, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get community feed
  async getCommunityFeed(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        contentTypes, 
        tags 
      } = options;

      const userProfile = await SocialProfile.findOne({ user: userId });
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const query = {
        visibility: { $in: ['Public', 'Friends'] }
      };

      // Filter by content types
      if (contentTypes && contentTypes.length > 0) {
        query.contentType = { $in: contentTypes };
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const feed = await CommunityFeed.find(query)
        .populate('author', 'displayName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await CommunityFeed.countDocuments(query);

      return {
        feed,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching community feed', { 
        userId, 
        options, 
        error: error.message 
      });
      throw error;
    }
  }

  // Interact with a community post
  async interactWithPost(userId, postId, interactionType, interactionData = {}) {
    try {
      const post = await CommunityFeed.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      switch (interactionType) {
        case 'like':
          await post.likePost(userId);
          break;
        case 'comment':
          await post.addComment({
            authorId: userId,
            content: interactionData.content
          });
          break;
        default:
          throw new Error('Invalid interaction type');
      }

      logger.info(`User ${userId} interacted with post ${postId}`);
      return post;
    } catch (error) {
      logger.error('Error interacting with post', { 
        userId, 
        postId, 
        interactionType, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new SocialService();
