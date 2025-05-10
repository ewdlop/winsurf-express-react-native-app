const express = require('express');
const AchievementService = require('../services/achievementService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Create achievement template (Admin only)
router.post('/templates', 
  AuthMiddleware.authenticate,
  AuthMiddleware.restrictTo('admin'),
  async (req, res, next) => {
    try {
      const achievementData = req.body;
      const achievement = await AchievementService.createAchievementTemplate(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      next(error);
    }
  }
);

// Bulk create achievement templates (Admin only)
router.post('/templates/bulk', 
  AuthMiddleware.authenticate,
  AuthMiddleware.restrictTo('admin'),
  async (req, res, next) => {
    try {
      const achievementsData = req.body;
      const achievements = await AchievementService.bulkCreateAchievementTemplates(achievementsData);
      res.status(201).json(achievements);
    } catch (error) {
      next(error);
    }
  }
);

// Get achievement templates
router.get('/templates', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { 
        category, 
        difficultyLevel, 
        page, 
        limit 
      } = req.query;

      const options = {
        category,
        difficultyLevel,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const achievementTemplates = await AchievementService.getAchievementTemplates(options);
      res.json(achievementTemplates);
    } catch (error) {
      next(error);
    }
  }
);

// Track achievement progress
router.post('/:achievementId/progress', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { achievementId } = req.params;
      const progressData = req.body;

      const userAchievement = await AchievementService.trackAchievementProgress(
        userId, 
        achievementId, 
        progressData
      );

      res.json(userAchievement);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's achievements
router.get('/me', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        completed, 
        category, 
        page, 
        limit 
      } = req.query;

      const options = {
        completed: completed !== undefined ? JSON.parse(completed) : null,
        category,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const userAchievements = await AchievementService.getUserAchievements(
        userId, 
        options
      );

      res.json(userAchievements);
    } catch (error) {
      next(error);
    }
  }
);

// Get recommended achievements
router.get('/recommended', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendedAchievements = await AchievementService.generateRecommendedAchievements(userId);
      res.json(recommendedAchievements);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
