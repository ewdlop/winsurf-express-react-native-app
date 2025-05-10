const CommunityFeed = require('../models/CommunityFeed');
const SocialProfile = require('../models/SocialProfile');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class CommunityFeedService {
  // Create a new post
  static async createPost(userId, postData) {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Enrich post data with author
      const postWithAuthor = {
        ...postData,
        authorId: userId
      };

      // Create and save the post
      const post = await CommunityFeed.createPost(postWithAuthor);

      // Update social profile's community points
      await SocialProfile.findOneAndUpdate(
        { user: userId },
        { $inc: { 'socialStats.communityPoints': 5 } }
      );

      return post;
    } catch (error) {
      throw error;
    }
  }

  // Get feed posts with filtering and pagination
  static async getFeedPosts(options = {}) {
    try {
      const {
        userId,
        page = 1,
        limit = 20,
        contentTypes = [],
        tags = [],
        visibility = 'Public'
      } = options;

      const query = { visibility };

      // Filter by content types if provided
      if (contentTypes.length > 0) {
        query.contentType = { $in: contentTypes };
      }

      // Filter by tags if provided
      if (tags.length > 0) {
        query.tags = { $in: tags };
      }

      // If user is provided, include their friends' posts
      if (userId) {
        const userProfile = await SocialProfile.findOne({ user: userId });
        const friendIds = userProfile.socialConnections
          .filter(conn => conn.status === 'accepted')
          .map(conn => conn.user);

        query.$or = [
          { author: { $in: [...friendIds, userId] } },
          { visibility: 'Public' }
        ];
      }

      const posts = await CommunityFeed.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'username profilePicture')
        .populate('comments.author', 'username profilePicture')
        .populate('relatedHealthGoal', 'title');

      const total = await CommunityFeed.countDocuments(query);

      return {
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      };
    } catch (error) {
      throw error;
    }
  }

  // Add a comment to a post
  static async addComment(userId, postId, commentData) {
    try {
      const post = await CommunityFeed.findById(postId);

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      const commentWithAuthor = {
        ...commentData,
        authorId: userId
      };

      const updatedPost = await post.addComment(commentWithAuthor);

      // Update social profile's community points
      await SocialProfile.findOneAndUpdate(
        { user: userId },
        { $inc: { 'socialStats.communityPoints': 2 } }
      );

      return updatedPost;
    } catch (error) {
      throw error;
    }
  }

  // Like a post
  static async likePost(userId, postId) {
    try {
      const post = await CommunityFeed.findById(postId);

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      const updatedPost = await post.likePost(userId);

      // Update social profile's community points
      await SocialProfile.findOneAndUpdate(
        { user: userId },
        { $inc: { 'socialStats.communityPoints': 1 } }
      );

      return updatedPost;
    } catch (error) {
      throw error;
    }
  }

  // Search posts by tags or content
  static async searchPosts(query, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;

      const searchQuery = {
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      };

      const posts = await CommunityFeed.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'username profilePicture');

      const total = await CommunityFeed.countDocuments(searchQuery);

      return {
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CommunityFeedService;
