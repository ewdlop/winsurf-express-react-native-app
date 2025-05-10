const express = require('express');
const MealPlan = require('../models/MealPlan');
const mealPlanningService = require('../services/mealPlanningService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Generate a new meal plan
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { 
      timeFrame = 'week', 
      calories, 
      diet, 
      exclude = [] 
    } = req.body;

    const mealPlan = await mealPlanningService.generateMealPlan(req.user.id, {
      timeFrame,
      calories,
      diet,
      exclude
    });

    // Save meal plan to database
    const savedMealPlan = new MealPlan({
      user: req.user.id,
      name: `${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Meal Plan`,
      startDate: new Date(),
      endDate: new Date(Date.now() + (timeFrame === 'week' ? 7 : 1) * 24 * 60 * 60 * 1000),
      goal: 'Improve Nutrition',
      meals: mealPlan.meals.map(meal => ({
        day: new Date(),
        mealType: 'Lunch', // You might want to enhance this
        foods: meal.ingredients.map(ing => ({
          foodName: ing.name,
          servingSize: {
            amount: ing.amount,
            unit: ing.unit
          },
          nutritionalInfo: {
            calories: meal.nutritionalInfo.calories,
            protein: meal.nutritionalInfo.protein,
            carbohydrates: meal.nutritionalInfo.carbohydrates,
            fat: meal.nutritionalInfo.fat
          },
          recipeUrl: meal.sourceUrl
        }))
      }))
    });

    await savedMealPlan.save();

    logger.info(`Meal plan generated for user ${req.user.id}`);
    res.status(201).json(savedMealPlan);
  } catch (error) {
    logger.error('Meal plan generation error', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error generating meal plan', 
      error: error.message 
    });
  }
});

// Get user's meal plans
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      user: req.user.id,
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (page - 1) * limit
    };

    const mealPlans = await MealPlan.find({ user: req.user.id }, null, options);
    const total = await MealPlan.countDocuments({ user: req.user.id });

    res.json({
      mealPlans,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching meal plans', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error fetching meal plans', 
      error: error.message 
    });
  }
});

// Get specific meal plan details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // Calculate nutrition summary
    const nutritionSummary = await MealPlan.calculateNutritionSummary(mealPlan._id);

    res.json({
      mealPlan,
      nutritionSummary
    });
  } catch (error) {
    logger.error('Error fetching meal plan details', { 
      userId: req.user.id, 
      mealPlanId: req.params.id,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error fetching meal plan details', 
      error: error.message 
    });
  }
});

// Delete a meal plan
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedMealPlan = await MealPlan.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!deletedMealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    logger.info(`Meal plan deleted for user ${req.user.id}`);
    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    logger.error('Error deleting meal plan', { 
      userId: req.user.id, 
      mealPlanId: req.params.id,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error deleting meal plan', 
      error: error.message 
    });
  }
});

module.exports = router;
