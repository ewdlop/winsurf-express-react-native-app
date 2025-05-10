const express = require('express');
const RewardsService = require('../services/rewardsService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Create reward template (Admin only)
router.post('/templates', 
  AuthMiddleware.authenticate,
  AuthMiddleware.restrictTo('admin'),
  async (req, res, next) => {
    try {
      const rewardData = req.body;
      const reward = await RewardsService.createRewardTemplate(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      next(error);
    }
  }
);

// Bulk create reward templates (Admin only)
router.post('/templates/bulk', 
  AuthMiddleware.authenticate,
  AuthMiddleware.restrictTo('admin'),
  async (req, res, next) => {
    try {
      const rewardsData = req.body;
      const rewards = await RewardsService.bulkCreateRewardTemplates(rewardsData);
      res.status(201).json(rewards);
    } catch (error) {
      next(error);
    }
  }
);

// Get reward templates
router.get('/templates', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { 
        type, 
        minPoints, 
        maxPoints,
        page, 
        limit 
      } = req.query;

      const options = {
        type,
        minPoints: parseInt(minPoints) || 0,
        maxPoints: parseInt(maxPoints) || 10000,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const rewardTemplates = await RewardsService.getRewardTemplates(options);
      res.json(rewardTemplates);
    } catch (error) {
      next(error);
    }
  }
);

// Earn a reward
router.post('/:rewardId/earn', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { rewardId } = req.params;

      const userReward = await RewardsService.earnReward(
        userId, 
        rewardId
      );

      res.status(201).json(userReward);
    } catch (error) {
      next(error);
    }
  }
);

// Redeem a reward
router.post('/:userRewardId/redeem', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { userRewardId } = req.params;

      const userReward = await RewardsService.redeemReward(
        userId, 
        userRewardId
      );

      res.json(userReward);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's rewards
router.get('/me', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        status, 
        page, 
        limit 
      } = req.query;

      const options = {
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const userRewards = await RewardsService.getUserRewards(
        userId, 
        options
      );

      res.json(userRewards);
    } catch (error) {
      next(error);
    }
  }
);

// Get recommended rewards
router.get('/recommended', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendedRewards = await RewardsService.generateRecommendedRewards(userId);
      res.json(recommendedRewards);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
