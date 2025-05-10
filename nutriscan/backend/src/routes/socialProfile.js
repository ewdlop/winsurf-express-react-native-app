const express = require('express');
const SocialProfileService = require('../services/socialProfileService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');
const upload = require('../utils/multerConfig');

const router = express.Router();

// Create or Update Social Profile
router.post('/', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const profileData = req.body;

      const socialProfile = await SocialProfileService.createOrUpdateProfile(
        userId, 
        profileData
      );

      res.status(201).json(socialProfile);
    } catch (error) {
      next(error);
    }
  }
);

// Get Current User's Social Profile
router.get('/me', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const socialProfile = await SocialProfileService.getProfileByUserId(userId);
      res.json(socialProfile);
    } catch (error) {
      next(error);
    }
  }
);

// Get Social Profile by User ID
router.get('/:userId', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const socialProfile = await SocialProfileService.getProfileByUserId(userId);
      res.json(socialProfile);
    } catch (error) {
      next(error);
    }
  }
);

// Upload Profile Picture
router.post('/picture', 
  AuthMiddleware.authenticate,
  upload.single('profilePicture'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError('No profile picture uploaded');
      }

      const userId = req.user._id;
      const profilePictureUrl = req.file.path;

      const socialProfile = await SocialProfileService.createOrUpdateProfile(
        userId, 
        { profilePicture: profilePictureUrl }
      );

      res.json({
        message: 'Profile picture uploaded successfully',
        profilePicture: socialProfile.profilePicture
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add Connection
router.post('/connect', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { connectionId } = req.body;

      const { userProfile, connectionProfile } = await SocialProfileService.addConnection(
        userId, 
        connectionId
      );

      res.status(201).json({
        message: 'Connection request sent',
        userProfile,
        connectionProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

// Accept Connection Request
router.put('/connect/accept', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { connectionId } = req.body;

      const { userProfile, connectionProfile } = await SocialProfileService.acceptConnectionRequest(
        userId, 
        connectionId
      );

      res.json({
        message: 'Connection request accepted',
        userProfile,
        connectionProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove Connection
router.delete('/connect/:connectionId', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { connectionId } = req.params;

      const { userProfile, connectionProfile } = await SocialProfileService.removeConnection(
        userId, 
        connectionId
      );

      res.json({
        message: 'Connection removed',
        userProfile,
        connectionProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

// Search Users
router.get('/search', 
  AuthMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { query } = req.query;

      if (!query) {
        throw new ValidationError('Search query is required');
      }

      const users = await SocialProfileService.searchUsers(query);

      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
