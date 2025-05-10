const express = require('express');
const HealthGoal = require('../models/HealthGoal');
const healthGoalService = require('../services/healthGoalService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Create a new health goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      type, 
      target, 
      targetDate, 
      motivationalQuote 
    } = req.body;

    const newHealthGoal = new HealthGoal({
      user: req.user.id,
      type,
      target,
      targetDate: new Date(targetDate),
      motivationalQuote,
      progressEntries: [{
        currentValue: target.value, // Initial progress entry
        notes: 'Goal creation'
      }]
    });

    const savedGoal = await newHealthGoal.save();

    logger.info(`Health goal created for user ${req.user.id}`);
    res.status(201).json(savedGoal);
  } catch (error) {
    logger.error('Error creating health goal', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error creating health goal', 
      error: error.message 
    });
  }
});

// Get user's health goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status = 'Active', page = 1, limit = 10 } = req.query;
    const options = {
      user: req.user.id,
      status,
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (page - 1) * limit
    };

    const healthGoals = await HealthGoal.find({ 
      user: req.user.id, 
      status 
    }, null, options);

    const total = await HealthGoal.countDocuments({ 
      user: req.user.id, 
      status 
    });

    res.json({
      healthGoals,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching health goals', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error fetching health goals', 
      error: error.message 
    });
  }
});

// Get specific health goal details with progress
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const healthGoal = await HealthGoal.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!healthGoal) {
      return res.status(404).json({ message: 'Health goal not found' });
    }

    // Calculate goal progress
    const progress = await HealthGoal.calculateProgress(healthGoal._id);

    res.json({
      healthGoal,
      progress
    });
  } catch (error) {
    logger.error('Error fetching health goal details', { 
      userId: req.user.id, 
      goalId: req.params.id,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error fetching health goal details', 
      error: error.message 
    });
  }
});

// Add progress entry to a health goal
router.post('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { currentValue, notes } = req.body;

    const healthGoal = await HealthGoal.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!healthGoal) {
      return res.status(404).json({ message: 'Health goal not found' });
    }

    const updatedGoal = await healthGoal.addProgressEntry(currentValue, notes);

    logger.info(`Progress entry added to health goal for user ${req.user.id}`);
    res.json(updatedGoal);
  } catch (error) {
    logger.error('Error adding progress entry', { 
      userId: req.user.id, 
      goalId: req.params.id,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error adding progress entry', 
      error: error.message 
    });
  }
});

// Get goal recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await healthGoalService.generateGoalRecommendations(req.user.id);

    res.json(recommendations);
  } catch (error) {
    logger.error('Error generating goal recommendations', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error generating goal recommendations', 
      error: error.message 
    });
  }
});

// Update health goal status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const updatedGoal = await HealthGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    );

    if (!updatedGoal) {
      return res.status(404).json({ message: 'Health goal not found' });
    }

    logger.info(`Health goal status updated for user ${req.user.id}`);
    res.json(updatedGoal);
  } catch (error) {
    logger.error('Error updating health goal status', { 
      userId: req.user.id, 
      goalId: req.params.id,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error updating health goal status', 
      error: error.message 
    });
  }
});

module.exports = router;
