const express = require('express');
const UserEngagementService = require('../services/userEngagementService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Log user interaction
router.post('/log', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        type, 
        category, 
        feature, 
        action, 
        metadata, 
        duration,
        device,
        location
      } = req.body;

      const interaction = await UserEngagementService.logInteraction(
        userId, 
        { 
          type, 
          category, 
          feature, 
          action, 
          metadata,
          duration,
          device,
          location
        }
      );

      res.status(201).json(interaction);
    } catch (error) {
      next(error);
    }
  }
);

// Get interaction analytics
router.get('/analytics', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['Admin', 'SuperAdmin']),
  async (req, res, next) => {
    try {
      const { 
        userId, 
        type, 
        category, 
        startDate, 
        endDate,
        page,
        limit
      } = req.query;

      const options = {
        userId,
        type,
        category,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      };

      const analytics = await UserEngagementService.getInteractionAnalytics(options);

      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
);

// Analyze user engagement
router.get('/analyze', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const engagement = await UserEngagementService.analyzeUserEngagement(userId);

      res.json(engagement);
    } catch (error) {
      next(error);
    }
  }
);

// Generate engagement recommendations
router.get('/recommendations', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await UserEngagementService.generateEngagementRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
