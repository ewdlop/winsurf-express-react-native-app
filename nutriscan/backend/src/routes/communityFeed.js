const express = require('express');
const CommunityFeedService = require('../services/communityFeedService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');
const upload = require('../utils/multerConfig');

const router = express.Router();

// Create a new post
router.post('/', 
  AuthMiddleware.authenticate,
  upload.array('attachments', 5),
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { content, contentType, tags, visibility, relatedHealthGoal } = req.body;

      // Process attachments
      const attachments = req.files ? req.files.map(file => ({
        type: file.mimetype.startsWith('image') ? 'Image' : 'Video',
        url: file.path
      })) : [];

      const postData = {
        content,
        contentType,
        attachments,
        tags: tags ? tags.split(',') : [],
        visibility,
        relatedHealthGoal
      };

      const post = await CommunityFeedService.createPost(userId, postData);

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
);

// Get feed posts
router.get('/', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        page, 
        limit, 
        contentTypes, 
        tags 
      } = req.query;

      const options = {
        userId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        contentTypes: contentTypes ? contentTypes.split(',') : [],
        tags: tags ? tags.split(',') : []
      };

      const feedPosts = await CommunityFeedService.getFeedPosts(options);

      res.json(feedPosts);
    } catch (error) {
      next(error);
    }
  }
);

// Add a comment to a post
router.post('/:postId/comments', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { postId } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new ValidationError('Comment content is required');
      }

      const commentData = { content };
      const updatedPost = await CommunityFeedService.addComment(
        userId, 
        postId, 
        commentData
      );

      res.status(201).json(updatedPost);
    } catch (error) {
      next(error);
    }
  }
);

// Like a post
router.post('/:postId/like', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      const updatedPost = await CommunityFeedService.likePost(
        userId, 
        postId
      );

      res.json(updatedPost);
    } catch (error) {
      next(error);
    }
  }
);

// Search posts
router.get('/search', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { query, page, limit } = req.query;

      if (!query) {
        throw new ValidationError('Search query is required');
      }

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const searchResults = await CommunityFeedService.searchPosts(
        query, 
        options
      );

      res.json(searchResults);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
