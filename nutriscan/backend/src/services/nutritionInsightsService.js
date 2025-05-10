const NutritionInsights = require('../models/NutritionInsights');
const NutritionEntry = require('../models/NutritionEntry');
const HealthGoal = require('../models/HealthGoal');
const logger = require('../utils/logger');

class NutritionInsightsService {
  // Generate comprehensive nutrition insights
  async generateNutritionInsights(userId) {
    try {
      // Generate or retrieve existing insights
      const insights = await NutritionInsights.generateInsights(userId);

      if (!insights) {
        logger.info(`No nutrition data available for user ${userId}`);
        return null;
      }

      // Enrich insights with additional context
      const enrichedInsights = await this._enrichInsights(userId, insights);

      logger.info(`Nutrition insights generated for user ${userId}`);
      return enrichedInsights;
    } catch (error) {
      logger.error('Error generating nutrition insights', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Enrich insights with additional context
  async _enrichInsights(userId, insights) {
    // Fetch related health goals
    const activeHealthGoals = await HealthGoal.find({ 
      user: userId, 
      status: 'Active' 
    });

    // Analyze nutrition entries in context of health goals
    const goalAlignmentAnalysis = await this._analyzeGoalAlignment(
      userId, 
      insights.nutritionalProfile, 
      activeHealthGoals
    );

    // Predict potential future trends
    const nutritionTrends = await this._predictNutritionTrends(userId);

    return {
      ...insights.toObject(),
      goalAlignment: goalAlignmentAnalysis,
      predictedTrends: nutritionTrends
    };
  }

  // Analyze nutrition profile alignment with health goals
  async _analyzeGoalAlignment(userId, nutritionalProfile, activeHealthGoals) {
    const goalAlignments = activeHealthGoals.map(goal => {
      let alignment = 'Neutral';
      let recommendedAdjustments = [];

      switch (goal.type) {
        case 'Weight Loss':
          if (nutritionalProfile.averageDailyIntake.calories > 2000) {
            alignment = 'Misaligned';
            recommendedAdjustments.push('Reduce calorie intake');
          }
          break;
        
        case 'Muscle Gain':
          if (nutritionalProfile.averageDailyIntake.protein < 150) {
            alignment = 'Partially Aligned';
            recommendedAdjustments.push('Increase protein intake');
          }
          break;
        
        case 'Nutrition Improvement':
          if (nutritionalProfile.macronutrientBalance.fatPercentage > 35) {
            alignment = 'Misaligned';
            recommendedAdjustments.push('Reduce fat intake');
          }
          break;
      }

      return {
        goalType: goal.type,
        alignment,
        recommendedAdjustments
      };
    });

    return goalAlignments;
  }

  // Predict future nutrition trends
  async _predictNutritionTrends(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const nutritionEntries = await NutritionEntry.find({
      user: userId,
      consumedAt: { $gte: thirtyDaysAgo }
    }).sort({ consumedAt: 1 });

    if (nutritionEntries.length < 10) {
      return null;
    }

    // Simple linear regression for trend prediction
    const trends = {
      calories: this._linearRegression(nutritionEntries.map(e => e.nutritionalInfo.calories)),
      protein: this._linearRegression(nutritionEntries.map(e => e.nutritionalInfo.protein)),
      carbohydrates: this._linearRegression(nutritionEntries.map(e => e.nutritionalInfo.carbohydrates)),
      fat: this._linearRegression(nutritionEntries.map(e => e.nutritionalInfo.fat))
    };

    return {
      shortTermPrediction: {
        description: 'Projected nutrition intake for the next 7-14 days',
        trends
      }
    };
  }

  // Simple linear regression for trend prediction
  _linearRegression(values) {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXSquare = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXSquare - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      intercept,
      nextValue: slope * n + intercept
    };
  }

  // Generate comprehensive nutrition report
  async generateNutritionReport(userId, timeFrame = 30) {
    try {
      const startDate = new Date(Date.now() - timeFrame * 24 * 60 * 60 * 1000);
      
      const nutritionEntries = await NutritionEntry.find({
        user: userId,
        consumedAt: { $gte: startDate }
      });

      const insights = await this.generateNutritionInsights(userId);

      const report = {
        timeFrame,
        totalEntries: nutritionEntries.length,
        insights,
        detailedBreakdown: {
          topConsumedFoods: this._analyzeTopFoods(nutritionEntries),
          mealTypeNutrition: this._analyzeMealTypeNutrition(nutritionEntries),
          weekdayNutritionPatterns: this._analyzeWeekdayPatterns(nutritionEntries)
        }
      };

      return report;
    } catch (error) {
      logger.error('Error generating nutrition report', { 
        userId, 
        timeFrame, 
        error: error.message 
      });
      throw error;
    }
  }

  // Analyze top consumed foods
  _analyzeTopFoods(nutritionEntries) {
    const foodConsumption = {};

    nutritionEntries.forEach(entry => {
      const foodName = entry.foodName;
      if (!foodConsumption[foodName]) {
        foodConsumption[foodName] = {
          count: 0,
          totalCalories: 0,
          totalProtein: 0
        };
      }

      foodConsumption[foodName].count++;
      foodConsumption[foodName].totalCalories += entry.nutritionalInfo.calories || 0;
      foodConsumption[foodName].totalProtein += entry.nutritionalInfo.protein || 0;
    });

    return Object.entries(foodConsumption)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([foodName, stats]) => ({
        foodName,
        ...stats
      }));
  }

  // Analyze nutrition by meal type
  _analyzeMealTypeNutrition(nutritionEntries) {
    const mealTypeStats = {
      Breakfast: { count: 0, calories: 0, protein: 0 },
      Lunch: { count: 0, calories: 0, protein: 0 },
      Dinner: { count: 0, calories: 0, protein: 0 },
      Snack: { count: 0, calories: 0, protein: 0 }
    };

    nutritionEntries.forEach(entry => {
      const mealType = entry.mealType || 'Snack';
      
      if (mealTypeStats[mealType]) {
        mealTypeStats[mealType].count++;
        mealTypeStats[mealType].calories += entry.nutritionalInfo.calories || 0;
        mealTypeStats[mealType].protein += entry.nutritionalInfo.protein || 0;
      }
    });

    return Object.entries(mealTypeStats).map(([mealType, stats]) => ({
      mealType,
      ...stats,
      avgCalories: stats.count > 0 ? stats.calories / stats.count : 0,
      avgProtein: stats.count > 0 ? stats.protein / stats.count : 0
    }));
  }

  // Analyze nutrition patterns by weekday
  _analyzeWeekdayPatterns(nutritionEntries) {
    const weekdayStats = {
      Monday: { count: 0, calories: 0 },
      Tuesday: { count: 0, calories: 0 },
      Wednesday: { count: 0, calories: 0 },
      Thursday: { count: 0, calories: 0 },
      Friday: { count: 0, calories: 0 },
      Saturday: { count: 0, calories: 0 },
      Sunday: { count: 0, calories: 0 }
    };

    nutritionEntries.forEach(entry => {
      const day = entry.consumedAt.toLocaleString('en-US', { weekday: 'long' });
      
      if (weekdayStats[day]) {
        weekdayStats[day].count++;
        weekdayStats[day].calories += entry.nutritionalInfo.calories || 0;
      }
    });

    return Object.entries(weekdayStats).map(([day, stats]) => ({
      day,
      ...stats,
      avgCalories: stats.count > 0 ? stats.calories / stats.count : 0
    }));
  }
}

module.exports = new NutritionInsightsService();
