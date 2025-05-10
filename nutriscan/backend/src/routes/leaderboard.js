const express = require('express');
const LeaderboardService = require('../services/leaderboardService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Get leaderboard for a specific category
router.get('/:category', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { category } = req.params;
      const { 
        page, 
        limit 
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        includeUserRank: true,
        userId: req.user._id
      };

      const leaderboard = await LeaderboardService.getLeaderboard(
        category, 
        options
      );

      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's rankings across all categories
router.get('/me/rankings', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const rankings = await LeaderboardService.getUserRankings(userId);

      res.json(rankings);
    } catch (error) {
      next(error);
    }
  }
);

// Sync user's leaderboard entries
router.post('/sync', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const leaderboardEntries = await LeaderboardService.syncLeaderboard(userId);

      res.json(leaderboardEntries);
    } catch (error) {
      next(error);
    }
  }
);

// Get personalized leaderboard recommendations
router.get('/recommendations/personalized', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await LeaderboardService.getPersonalizedLeaderboardRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
