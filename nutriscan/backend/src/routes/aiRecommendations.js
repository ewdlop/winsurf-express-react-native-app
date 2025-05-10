const express = require('express');
const aiRecommendationService = require('../services/aiRecommendationService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Generate AI recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await aiRecommendationService.generateRecommendations(req.user.id);
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Error generating AI recommendations', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error generating AI recommendations', 
      error: error.message 
    });
  }
});

// Personalize recommendations
router.post('/personalize', authMiddleware, async (req, res) => {
  try {
    const { 
      focusArea, 
      timeConstraints, 
      equipmentAvailability, 
      healthConditions 
    } = req.body;

    const personalizedRecommendations = await aiRecommendationService.personalizeRecommendations(
      req.user.id, 
      { 
        focusArea, 
        timeConstraints, 
        equipmentAvailability, 
        healthConditions 
      }
    );
    
    res.json(personalizedRecommendations);
  } catch (error) {
    logger.error('Error personalizing recommendations', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error personalizing recommendations', 
      error: error.message 
    });
  }
});

// Generate targeted interventions
router.get('/interventions', authMiddleware, async (req, res) => {
  try {
    const interventions = await aiRecommendationService.generateTargetedInterventions(req.user.id);
    
    res.json(interventions);
  } catch (error) {
    logger.error('Error generating targeted interventions', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error generating targeted interventions', 
      error: error.message 
    });
  }
});

// Get specific recommendation category
router.get('/recommendations/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const recommendations = await aiRecommendationService.generateRecommendations(req.user.id);
    
    let specificRecommendations;
    switch (category) {
      case 'nutrition':
        specificRecommendations = recommendations.recommendationProfiles.nutrition;
        break;
      case 'fitness':
        specificRecommendations = recommendations.recommendationProfiles.fitness;
        break;
      case 'mental-wellness':
        specificRecommendations = recommendations.recommendationProfiles.mentalWellness;
        break;
      case 'weight-management':
        specificRecommendations = recommendations.recommendationProfiles.weightManagement;
        break;
      case 'preventive-care':
        specificRecommendations = recommendations.recommendationProfiles.preventiveCare;
        break;
      default:
        return res.status(400).json({ message: 'Invalid recommendation category' });
    }

    res.json(specificRecommendations);
  } catch (error) {
    logger.error('Error retrieving specific recommendation category', { 
      userId: req.user.id, 
      category: req.params.category,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error retrieving specific recommendation category', 
      error: error.message 
    });
  }
});

module.exports = router;
