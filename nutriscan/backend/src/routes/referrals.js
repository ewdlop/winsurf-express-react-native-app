const express = require('express');
const ReferralService = require('../services/referralService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Create a new referral
router.post('/create', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        type, 
        metadata 
      } = req.body;

      const referral = await ReferralService.createReferral(
        userId, 
        { type, metadata }
      );

      res.status(201).json(referral);
    } catch (error) {
      next(error);
    }
  }
);

// Complete a referral (when a new user signs up)
router.post('/complete', 
  async (req, res, next) => {
    try {
      const { 
        referralCode, 
        referredUserId 
      } = req.body;

      const result = await ReferralService.completeReferral(
        referralCode, 
        referredUserId
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's referrals
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

      const userReferrals = await ReferralService.getUserReferrals(
        userId, 
        options
      );

      res.json(userReferrals);
    } catch (error) {
      next(error);
    }
  }
);

// Get referral statistics
router.get('/statistics', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const referralStats = await ReferralService.getReferralStatistics(userId);

      res.json(referralStats);
    } catch (error) {
      next(error);
    }
  }
);

// Generate referral recommendations
router.get('/recommendations', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await ReferralService.generateReferralRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Create affiliate marketing referral
router.post('/affiliate', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        campaignId, 
        trackingSource 
      } = req.body;

      const referral = await ReferralService.createAffiliateReferral(
        userId, 
        { campaignId, trackingSource }
      );

      res.status(201).json(referral);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
