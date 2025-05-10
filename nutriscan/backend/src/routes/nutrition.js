const express = require('express');
const NutritionEntry = require('../models/NutritionEntry');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Add a new nutrition entry
router.post('/entry', authMiddleware, async (req, res) => {
  try {
    const { 
      foodName, 
      servingSize, 
      nutritionalInfo, 
      mealType, 
      consumedAt, 
      imageUrl, 
      notes 
    } = req.body;

    const newEntry = new NutritionEntry({
      user: req.user.id,
      foodName,
      servingSize,
      nutritionalInfo,
      mealType,
      consumedAt: consumedAt || new Date(),
      imageUrl,
      notes
    });

    const savedEntry = await newEntry.save();

    logger.info(`Nutrition entry added for user ${req.user.id}`);
    res.status(201).json(savedEntry);
  } catch (error) {
    logger.error('Error adding nutrition entry', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ message: 'Error adding nutrition entry', error: error.message });
  }
});

// Get nutrition entries for a specific date range
router.get('/entries', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      user: req.user.id,
      consumedAt: {
        $gte: new Date(startDate || new Date().setDate(new Date().getDate() - 7)),
        $lte: new Date(endDate || Date.now())
      }
    };

    const entries = await NutritionEntry.find(query).sort({ consumedAt: -1 });

    res.json(entries);
  } catch (error) {
    logger.error('Error fetching nutrition entries', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ message: 'Error fetching nutrition entries', error: error.message });
  }
});

// Get daily nutrition summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const summary = await NutritionEntry.getDailySummary(req.user.id, date || new Date());

    res.json(summary);
  } catch (error) {
    logger.error('Error getting daily nutrition summary', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ message: 'Error getting daily nutrition summary', error: error.message });
  }
});

// Update a nutrition entry
router.put('/entry/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedEntry = await NutritionEntry.findOneAndUpdate(
      { _id: id, user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: 'Nutrition entry not found' });
    }

    logger.info(`Nutrition entry updated for user ${req.user.id}`);
    res.json(updatedEntry);
  } catch (error) {
    logger.error('Error updating nutrition entry', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ message: 'Error updating nutrition entry', error: error.message });
  }
});

// Delete a nutrition entry
router.delete('/entry/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEntry = await NutritionEntry.findOneAndDelete({ 
      _id: id, 
      user: req.user.id 
    });

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Nutrition entry not found' });
    }

    logger.info(`Nutrition entry deleted for user ${req.user.id}`);
    res.json({ message: 'Nutrition entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting nutrition entry', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ message: 'Error deleting nutrition entry', error: error.message });
  }
});

module.exports = router;
