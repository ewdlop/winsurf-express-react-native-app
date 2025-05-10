const HealthGoal = require('../models/HealthGoal');
const NutritionEntry = require('../models/NutritionEntry');
const logger = require('../utils/logger');

class HealthGoalService {
  // Generate personalized goal recommendations
  async generateGoalRecommendations(userId) {
    try {
      // Analyze user's nutrition and activity history
      const nutritionHistory = await this._analyzeNutritionHistory(userId);
      const fitnessInsights = await this._analyzeFitnessData(userId);

      // Generate goal recommendations based on insights
      const recommendations = [
        {
          type: 'Weight Loss',
          rationale: this._generateWeightLossRationale(nutritionHistory, fitnessInsights)
        },
        {
          type: 'Muscle Gain',
          rationale: this._generateMuscleGainRationale(nutritionHistory, fitnessInsights)
        },
        {
          type: 'Nutrition Improvement',
          rationale: this._generateNutritionRationale(nutritionHistory)
        }
      ];

      return recommendations.filter(rec => rec.rationale !== null);
    } catch (error) {
      logger.error('Goal recommendation generation error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Analyze user's nutrition history
  async _analyzeNutritionHistory(userId) {
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
      avgDailyProtein: nutritionSummary.entryCount > 0
        ? nutritionSummary.totalProtein / nutritionSummary.entryCount
        : 50,
      nutritionSummary
    };
  }

  // Analyze user's fitness data (placeholder)
  async _analyzeFitnessData(userId) {
    // In a real-world scenario, this would integrate with fitness tracking APIs
    // or additional fitness tracking models
    return {
      avgDailySteps: 5000,
      avgWeeklyExerciseMinutes: 120
    };
  }

  // Generate weight loss goal rationale
  _generateWeightLossRationale(nutritionHistory, fitnessInsights) {
    if (nutritionHistory.avgDailyCalories > 2500 && fitnessInsights.avgDailySteps < 7000) {
      return {
        targetCalories: 2000,
        targetWeight: null, // Would be calculated based on user's current weight
        recommendedActivity: 'Increase daily steps to 10,000 and reduce calorie intake'
      };
    }
    return null;
  }

  // Generate muscle gain goal rationale
  _generateMuscleGainRationale(nutritionHistory, fitnessInsights) {
    if (nutritionHistory.avgDailyProtein < 100 && fitnessInsights.avgWeeklyExerciseMinutes > 180) {
      return {
        targetProtein: 150,
        recommendedActivity: 'Increase protein intake and continue strength training'
      };
    }
    return null;
  }

  // Generate nutrition improvement rationale
  _generateNutritionRationale(nutritionHistory) {
    const balancedNutrition = this._checkNutritionBalance(nutritionHistory);
    
    if (!balancedNutrition) {
      return {
        nutritionalImbalances: ['Low protein', 'High carbohydrates'],
        recommendations: [
          'Increase protein intake',
          'Reduce simple carbohydrate consumption',
          'Incorporate more whole foods'
        ]
      };
    }
    return null;
  }

  // Check nutrition balance
  _checkNutritionBalance(nutritionHistory) {
    const { avgDailyCalories, avgDailyProtein } = nutritionHistory;
    
    // Basic nutrition balance check
    return (
      avgDailyCalories > 1800 && 
      avgDailyCalories < 2500 && 
      avgDailyProtein >= 50 && 
      avgDailyProtein <= 150
    );
  }
}

module.exports = new HealthGoalService();
