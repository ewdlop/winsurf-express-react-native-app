const express = require('express');
const RecommendationService = require('../services/recommendationService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Create a recommendation
router.post('/create', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['Admin', 'SuperAdmin']),
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        category, 
        type, 
        title, 
        description,
        confidenceLevel,
        metadata,
        actionItems,
        tags
      } = req.body;

      const recommendation = await RecommendationService.createRecommendation(
        userId, 
        { 
          category, 
          type, 
          title, 
          description,
          confidenceLevel,
          metadata,
          actionItems,
          tags
        }
      );

      res.status(201).json(recommendation);
    } catch (error) {
      next(error);
    }
  }
);

// Get personalized recommendations
router.get('/personalized', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        category, 
        minRelevanceScore,
        page,
        limit
      } = req.query;

      const options = {
        category,
        minRelevanceScore: parseInt(minRelevanceScore) || 50,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        userId, 
        options
      );

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Generate contextual recommendations
router.get('/contextual', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await RecommendationService.generateContextualRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Generate machine learning-driven recommendations
router.get('/ml-driven', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await RecommendationService.generateMLDrivenRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Process recommendation feedback
router.post('/feedback/:recommendationId', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { recommendationId } = req.params;
      const { 
        rating, 
        actionTaken, 
        comments 
      } = req.body;

      const updatedRecommendation = await RecommendationService.processRecommendationFeedback(
        userId, 
        recommendationId, 
        { rating, actionTaken, comments }
      );

      res.json(updatedRecommendation);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
