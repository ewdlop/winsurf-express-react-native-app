const axios = require('axios');
const logger = require('../utils/logger');
const NutritionEntry = require('../models/NutritionEntry');
const User = require('../models/User');

class MealPlanningService {
  constructor() {
    this.spoonacularBaseUrl = 'https://api.spoonacular.com/mealplanner';
    this.apiKey = process.env.SPOONACULAR_API_KEY;
  }

  // Generate personalized meal plan
  async generateMealPlan(userId, options = {}) {
    try {
      // Fetch user details
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's nutritional history and goals
      const nutritionHistory = await this._getUserNutritionProfile(userId);

      // Prepare meal plan parameters
      const mealPlanParams = {
        timeFrame: options.timeFrame || 'week',
        targetCalories: options.calories || nutritionHistory.avgDailyCalories,
        diet: options.diet || user.dietaryRestrictions[0] || 'balanced',
        exclude: options.exclude || []
      };

      // Call Spoonacular API for meal plan
      const response = await this._generateSpoonacularMealPlan(mealPlanParams);

      // Transform and enrich meal plan
      const enrichedMealPlan = await this._enrichMealPlan(response, userId);

      logger.info(`Meal plan generated for user ${userId}`);
      return enrichedMealPlan;
    } catch (error) {
      logger.error('Meal plan generation error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get user's nutritional profile
  async _getUserNutritionProfile(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const nutritionEntries = await NutritionEntry.find({
      user: userId,
      consumedAt: { $gte: thirtyDaysAgo }
    });

    const nutritionSummary = nutritionEntries.reduce((acc, entry) => {
      acc.totalCalories += entry.nutritionalInfo.calories || 0;
      acc.totalProtein += entry.nutritionalInfo.protein || 0;
      acc.totalCarbohydrates += entry.nutritionalInfo.carbohydrates || 0;
      acc.totalFat += entry.nutritionalInfo.fat || 0;
      acc.entryCount++;
      return acc;
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrates: 0,
      totalFat: 0,
      entryCount: 0
    });

    return {
      avgDailyCalories: nutritionSummary.entryCount > 0 
        ? nutritionSummary.totalCalories / nutritionSummary.entryCount 
        : 2000,
      nutritionSummary
    };
  }

  // Generate meal plan via Spoonacular
  async _generateSpoonacularMealPlan(params) {
    try {
      const response = await axios.get(`${this.spoonacularBaseUrl}/generate`, {
        params: {
          apiKey: this.apiKey,
          timeFrame: params.timeFrame,
          targetCalories: params.targetCalories,
          diet: params.diet,
          exclude: params.exclude.join(',')
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Spoonacular meal plan generation error', { 
        params, 
        error: error.message 
      });
      throw error;
    }
  }

  // Enrich meal plan with additional details
  async _enrichMealPlan(mealPlanData, userId) {
    const enrichedMeals = await Promise.all(
      mealPlanData.items.map(async (meal) => {
        // Get detailed recipe information
        const recipeDetails = await this._getRecipeDetails(meal.id);

        return {
          id: meal.id,
          title: meal.title,
          readyInMinutes: recipeDetails.readyInMinutes,
          servings: recipeDetails.servings,
          sourceUrl: recipeDetails.sourceUrl,
          nutritionalInfo: {
            calories: recipeDetails.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0,
            protein: recipeDetails.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
            carbohydrates: recipeDetails.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
            fat: recipeDetails.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0
          },
          ingredients: recipeDetails.extendedIngredients.map(ing => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit
          }))
        };
      })
    );

    return {
      userId,
      timeFrame: mealPlanData.timeFrame,
      meals: enrichedMeals
    };
  }

  // Get detailed recipe information
  async _getRecipeDetails(recipeId) {
    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
        params: {
          apiKey: this.apiKey,
          includeNutrition: true
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Recipe details fetch error', { 
        recipeId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new MealPlanningService();
