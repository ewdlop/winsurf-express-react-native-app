const express = require('express');
const NutritionInsights = require('../models/NutritionInsights');
const nutritionInsightsService = require('../services/nutritionInsightsService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Get personalized nutrition insights
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const insights = await nutritionInsightsService.generateNutritionInsights(req.user.id);

    if (!insights) {
      return res.status(404).json({ 
        message: 'No nutrition data available to generate insights' 
      });
    }

    res.json(insights);
  } catch (error) {
    logger.error('Error retrieving nutrition insights', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error retrieving nutrition insights', 
      error: error.message 
    });
  }
});

// Generate comprehensive nutrition report
router.get('/report', authMiddleware, async (req, res) => {
  try {
    const { timeFrame = 30 } = req.query;

    const report = await nutritionInsightsService.generateNutritionReport(
      req.user.id, 
      parseInt(timeFrame)
    );

    res.json(report);
  } catch (error) {
    logger.error('Error generating nutrition report', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error generating nutrition report', 
      error: error.message 
    });
  }
});

// Get specific nutrition insight details
router.get('/insights/:insightType', authMiddleware, async (req, res) => {
  try {
    const { insightType } = req.params;
    const insights = await NutritionInsights.findOne({ user: req.user.id });

    if (!insights) {
      return res.status(404).json({ 
        message: 'No nutrition insights found' 
      });
    }

    let specificInsight;
    switch (insightType) {
      case 'nutritional-profile':
        specificInsight = insights.nutritionalProfile;
        break;
      case 'micronutrient-status':
        specificInsight = insights.micronutrientStatus;
        break;
      case 'health-risks':
        specificInsight = insights.healthRisks;
        break;
      case 'recommendations':
        specificInsight = insights.personalizedRecommendations;
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid insight type' 
        });
    }

    res.json(specificInsight);
  } catch (error) {
    logger.error('Error retrieving specific nutrition insight', { 
      userId: req.user.id, 
      insightType: req.params.insightType,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error retrieving specific nutrition insight', 
      error: error.message 
    });
  }
});

module.exports = router;
