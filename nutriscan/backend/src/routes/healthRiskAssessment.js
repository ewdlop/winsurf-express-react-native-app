const express = require('express');
const HealthRiskAssessmentService = require('../services/healthRiskAssessmentService');
const AuthMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Create health risk assessment
router.post('/assess', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        healthIndicators, 
        metadata 
      } = req.body;

      const assessment = await HealthRiskAssessmentService.createHealthRiskAssessment(
        userId, 
        { 
          healthIndicators, 
          metadata 
        }
      );

      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  }
);

// Get historical health risk assessments
router.get('/history', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { 
        startDate, 
        endDate,
        page,
        limit
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const historicalAssessments = await HealthRiskAssessmentService.getHistoricalAssessments(
        userId, 
        options
      );

      res.json(historicalAssessments);
    } catch (error) {
      next(error);
    }
  }
);

// Generate health improvement recommendations
router.get('/recommendations', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const recommendations = await HealthRiskAssessmentService.generateHealthImprovementRecommendations(userId);

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Predict health trajectory
router.get('/trajectory', 
  AuthMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const trajectoryAnalysis = await HealthRiskAssessmentService.predictHealthTrajectory(userId);

      res.json(trajectoryAnalysis);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
