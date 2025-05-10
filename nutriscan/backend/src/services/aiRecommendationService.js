const AIRecommendation = require('../models/AIRecommendation');
const NutritionEntry = require('../models/NutritionEntry');
const HealthGoal = require('../models/HealthGoal');
const logger = require('../utils/logger');

class AIRecommendationService {
  // Generate comprehensive AI recommendations
  async generateRecommendations(userId) {
    try {
      const recommendations = await AIRecommendation.generateRecommendations(userId);
      
      logger.info(`AI recommendations generated for user ${userId}`);
      return recommendations;
    } catch (error) {
      logger.error('Error generating AI recommendations', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Personalize recommendations based on specific context
  async personalizeRecommendations(userId, context) {
    try {
      const recommendations = await this.generateRecommendations(userId);
      
      // Context-specific personalization
      const personalizedRecommendations = this._applyContextualPersonalization(
        recommendations, 
        context
      );

      logger.info(`Personalized AI recommendations generated for user ${userId}`);
      return personalizedRecommendations;
    } catch (error) {
      logger.error('Error personalizing recommendations', { 
        userId, 
        context, 
        error: error.message 
      });
      throw error;
    }
  }

  // Apply contextual personalization
  _applyContextualPersonalization(recommendations, context) {
    const { 
      focusArea, 
      timeConstraints, 
      equipmentAvailability, 
      healthConditions 
    } = context;

    // Deep clone recommendations to avoid mutating original
    const personalizedRecs = JSON.parse(JSON.stringify(recommendations));

    // Personalize based on focus area
    if (focusArea) {
      switch (focusArea) {
        case 'Weight Loss':
          personalizedRecs.weightManagement.calorieTargets.deficitOrSurplus = -500;
          personalizedRecs.fitness.exerciseRecommendations[0].intensity = 'High';
          break;
        
        case 'Muscle Gain':
          personalizedRecs.weightManagement.calorieTargets.deficitOrSurplus = 300;
          personalizedRecs.fitness.exerciseRecommendations[0].type = 'Strength Training';
          personalizedRecs.fitness.exerciseRecommendations[0].intensity = 'High';
          break;
        
        case 'Mental Wellness':
          personalizedRecs.mentalWellness.stressManagement.techniques[0].duration = 30;
          break;
      }
    }

    // Adjust for time constraints
    if (timeConstraints) {
      personalizedRecs.fitness.exerciseRecommendations[0].duration = 
        Math.min(personalizedRecs.fitness.exerciseRecommendations[0].duration, timeConstraints);
    }

    // Modify recommendations based on equipment
    if (equipmentAvailability === 'Limited') {
      personalizedRecs.fitness.exerciseRecommendations[0].type = 'Bodyweight Training';
    }

    // Consider health conditions
    if (healthConditions && healthConditions.length > 0) {
      healthConditions.forEach(condition => {
        switch (condition) {
          case 'Diabetes':
            personalizedRecs.nutrition.personalizedDiet.type = 'Low-Carb';
            break;
          
          case 'Heart Condition':
            personalizedRecs.fitness.exerciseRecommendations[0].intensity = 'Low';
            break;
          
          case 'Joint Issues':
            personalizedRecs.fitness.exerciseRecommendations[0].type = 'Low-Impact';
            break;
        }
      });
    }

    return personalizedRecs;
  }

  // Generate targeted intervention recommendations
  async generateTargetedInterventions(userId) {
    try {
      // Fetch comprehensive user data
      const [
        nutritionEntries,
        healthGoals,
        healthProfile
      ] = await Promise.all([
        NutritionEntry.find({ user: userId }),
        HealthGoal.find({ user: userId, status: 'Active' }),
        User.findById(userId)
      ]);

      // Analyze potential intervention areas
      const interventions = this._identifyInterventionOpportunities(
        nutritionEntries,
        healthGoals,
        healthProfile
      );

      logger.info(`Targeted interventions generated for user ${userId}`);
      return interventions;
    } catch (error) {
      logger.error('Error generating targeted interventions', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Identify potential intervention opportunities
  _identifyInterventionOpportunities(nutritionEntries, healthGoals, healthProfile) {
    const interventions = [];

    // Nutrition Intervention
    const nutritionQuality = this._assessNutritionQuality(nutritionEntries);
    if (nutritionQuality.score < 0.6) {
      interventions.push({
        type: 'Nutrition',
        priority: 'High',
        recommendations: [
          'Increase whole food intake',
          'Reduce processed food consumption',
          'Balance macronutrient intake'
        ],
        rationale: nutritionQuality.details
      });
    }

    // Goal Progress Intervention
    const goalProgress = this._assessGoalProgress(healthGoals);
    if (goalProgress.adherence < 0.5) {
      interventions.push({
        type: 'Goal Tracking',
        priority: 'Moderate',
        recommendations: [
          'Break down goals into smaller milestones',
          'Implement accountability mechanisms',
          'Adjust goal parameters'
        ],
        rationale: goalProgress.details
      });
    }

    // Health Risk Intervention
    const healthRisks = this._identifyHealthRisks(healthProfile, nutritionEntries);
    if (healthRisks.length > 0) {
      interventions.push({
        type: 'Preventive Care',
        priority: 'High',
        recommendations: healthRisks.flatMap(risk => risk.preventiveActions),
        rationale: healthRisks.map(risk => risk.description).join('; ')
      });
    }

    return interventions;
  }

  // Assess nutrition quality
  _assessNutritionQuality(nutritionEntries) {
    const diversityScore = this._calculateNutrientDiversity(nutritionEntries);
    const processedFoodRatio = this._calculateProcessedFoodRatio(nutritionEntries);

    const score = (diversityScore + (1 - processedFoodRatio)) / 2;

    return {
      score,
      details: `Nutrient Diversity: ${diversityScore.toFixed(2)}, Processed Food Ratio: ${processedFoodRatio.toFixed(2)}`
    };
  }

  // Calculate nutrient diversity
  _calculateNutrientDiversity(nutritionEntries) {
    const uniqueFoods = new Set(nutritionEntries.map(entry => entry.foodName));
    return Math.min(uniqueFoods.size / 20, 1); // Normalize to max 1
  }

  // Calculate processed food ratio
  _calculateProcessedFoodRatio(nutritionEntries) {
    const processedFoods = nutritionEntries.filter(entry => 
      entry.foodName.toLowerCase().includes('processed') || 
      entry.foodName.toLowerCase().includes('packaged')
    );
    return processedFoods.length / nutritionEntries.length;
  }

  // Assess goal progress
  _assessGoalProgress(healthGoals) {
    const completedGoals = healthGoals.filter(goal => goal.status === 'Completed');
    const adherence = completedGoals.length / healthGoals.length;

    return {
      adherence,
      details: `Completed Goals: ${completedGoals.length}/${healthGoals.length}`
    };
  }

  // Identify potential health risks
  _identifyHealthRisks(healthProfile, nutritionEntries) {
    const risks = [];

    // Example risk identification logic
    const avgCalories = nutritionEntries.reduce((sum, entry) => 
      sum + (entry.nutritionalInfo.calories || 0), 0
    ) / nutritionEntries.length;

    if (avgCalories > 2500) {
      risks.push({
        type: 'Metabolic',
        description: 'High calorie intake detected',
        preventiveActions: [
          'Reduce daily calorie intake',
          'Increase physical activity',
          'Choose nutrient-dense, lower-calorie foods'
        ]
      });
    }

    // Add more risk identification logic as needed

    return risks;
  }
}

module.exports = new AIRecommendationService();
