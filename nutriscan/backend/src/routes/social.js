const express = require('express');
const SocialProfile = require('../models/SocialProfile');
const socialService = require('../services/socialService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});

// Create or update social profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const profileData = req.body;
    const socialProfile = await socialService.createOrUpdateProfile(req.user.id, profileData);
    
    res.status(201).json(socialProfile);
  } catch (error) {
    logger.error('Error creating/updating social profile', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error creating/updating social profile', 
      error: error.message 
    });
  }
});

// Upload profile picture
router.post('/profile/picture', 
  authMiddleware, 
  upload.single('profilePicture'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const socialProfile = await SocialProfile.findOne({ user: req.user.id });
      
      if (!socialProfile) {
        return res.status(404).json({ message: 'Social profile not found' });
      }

      socialProfile.profilePicture = req.file.filename;
      await socialProfile.save();

      res.json({ 
        message: 'Profile picture uploaded successfully', 
        filename: req.file.filename 
      });
    } catch (error) {
      logger.error('Error uploading profile picture', { 
        userId: req.user.id, 
        error: error.message 
      });
      res.status(400).json({ 
        message: 'Error uploading profile picture', 
        error: error.message 
      });
    }
});

// Find users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { 
      healthFocus, 
      dietaryPreferences, 
      communityRankMin, 
      displayName 
    } = req.query;

    const searchParams = {
      healthFocus: healthFocus ? healthFocus.split(',') : undefined,
      dietaryPreferences: dietaryPreferences ? dietaryPreferences.split(',') : undefined,
      communityRankMin: communityRankMin ? parseInt(communityRankMin) : undefined,
      displayName
    };

    const users = await socialService.findUsers(searchParams);
    
    res.json(users);
  } catch (error) {
    logger.error('Error finding users', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error finding users', 
      error: error.message 
    });
  }
});

// Manage social connections
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { targetUserId, connectionType } = req.body;

    const socialProfile = await socialService.manageSocialConnection(
      req.user.id, 
      targetUserId, 
      connectionType
    );
    
    res.json(socialProfile);
  } catch (error) {
    logger.error('Error managing social connection', { 
      currentUserId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error managing social connection', 
      error: error.message 
    });
  }
});

// Create community post
router.post('/feed', authMiddleware, async (req, res) => {
  try {
    const postData = {
      ...req.body,
      authorId: req.user.id
    };

    const post = await socialService.createCommunityPost(postData);
    
    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating community post', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error creating community post', 
      error: error.message 
    });
  }
});

// Get community feed
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const { 
      page, 
      limit, 
      contentTypes, 
      tags 
    } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      contentTypes: contentTypes ? contentTypes.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined
    };

    const feed = await socialService.getCommunityFeed(req.user.id, options);
    
    res.json(feed);
  } catch (error) {
    logger.error('Error fetching community feed', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error fetching community feed', 
      error: error.message 
    });
  }
});

// Interact with a community post
router.post('/feed/:postId/interact', authMiddleware, async (req, res) => {
  try {
    const { interactionType, interactionData } = req.body;

    const post = await socialService.interactWithPost(
      req.user.id, 
      req.params.postId, 
      interactionType,
      interactionData
    );
    
    res.json(post);
  } catch (error) {
    logger.error('Error interacting with post', { 
      userId: req.user.id, 
      postId: req.params.postId,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error interacting with post', 
      error: error.message 
    });
  }
});

module.exports = router;
