const mongoose = require('mongoose');

const NutritionInsightsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  nutritionalProfile: {
    averageDailyIntake: {
      calories: Number,
      protein: Number,
      carbohydrates: Number,
      fat: Number,
      sugar: Number,
      fiber: Number
    },
    macronutrientBalance: {
      proteinPercentage: Number,
      carbPercentage: Number,
      fatPercentage: Number
    }
  },
  micronutrientStatus: {
    vitamins: [{
      name: {
        type: String,
        enum: [
          'Vitamin A', 'Vitamin B1', 'Vitamin B2', 'Vitamin B3', 
          'Vitamin B6', 'Vitamin B12', 'Vitamin C', 'Vitamin D', 
          'Vitamin E', 'Vitamin K', 'Folate'
        ]
      },
      level: {
        type: String,
        enum: ['Deficient', 'Low', 'Optimal', 'High']
      },
      currentValue: Number,
      recommendedValue: Number
    }],
    minerals: [{
      name: {
        type: String,
        enum: [
          'Calcium', 'Iron', 'Magnesium', 'Zinc', 
          'Potassium', 'Selenium', 'Phosphorus'
        ]
      },
      level: {
        type: String,
        enum: ['Deficient', 'Low', 'Optimal', 'High']
      },
      currentValue: Number,
      recommendedValue: Number
    }]
  },
  dietaryTrends: {
    weeklyNutrientVariation: {
      calories: [Number],
      protein: [Number],
      carbohydrates: [Number],
      fat: [Number]
    },
    foodGroupConsumption: {
      fruits: Number,
      vegetables: Number,
      grains: Number,
      proteins: Number,
      dairy: Number,
      fats: Number
    }
  },
  healthRisks: [{
    type: {
      type: String,
      enum: [
        'Nutrient Deficiency', 
        'Metabolic Imbalance', 
        'Cardiovascular Risk', 
        'Inflammation Marker'
      ]
    },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'High']
    },
    details: String,
    recommendedActions: [String]
  }],
  personalizedRecommendations: [{
    category: {
      type: String,
      enum: [
        'Nutrition', 
        'Supplementation', 
        'Lifestyle', 
        'Exercise', 
        'Stress Management'
      ]
    },
    recommendation: String,
    rationale: String,
    confidenceScore: Number
  }],
  lastAnalysisDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
NutritionInsightsSchema.index({ user: 1, lastAnalysisDate: -1 });

// Static method to generate nutrition insights
NutritionInsightsSchema.statics.generateInsights = async function(userId) {
  const nutritionEntries = await mongoose.model('NutritionEntry').find({ 
    user: userId, 
    consumedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
  });

  if (nutritionEntries.length === 0) {
    return null;
  }

  const insights = this._calculateNutritionInsights(nutritionEntries);
  
  // Check if insights already exist for the user
  let existingInsights = await this.findOne({ user: userId });
  
  if (!existingInsights) {
    existingInsights = new this({ user: userId });
  }

  // Update insights
  Object.assign(existingInsights, insights);
  
  return existingInsights.save();
};

// Private method to calculate nutrition insights
NutritionInsightsSchema.statics._calculateNutritionInsights = function(nutritionEntries) {
  const totalNutrition = nutritionEntries.reduce((acc, entry) => {
    const { nutritionalInfo } = entry;
    
    acc.calories += nutritionalInfo.calories || 0;
    acc.protein += nutritionalInfo.protein || 0;
    acc.carbohydrates += nutritionalInfo.carbohydrates || 0;
    acc.fat += nutritionalInfo.fat || 0;
    acc.sugar += nutritionalInfo.sugar || 0;
    acc.fiber += nutritionalInfo.fiber || 0;
    
    return acc;
  }, {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    sugar: 0,
    fiber: 0
  });

  const entryCount = nutritionEntries.length;

  const nutritionalProfile = {
    averageDailyIntake: {
      calories: totalNutrition.calories / entryCount,
      protein: totalNutrition.protein / entryCount,
      carbohydrates: totalNutrition.carbohydrates / entryCount,
      fat: totalNutrition.fat / entryCount,
      sugar: totalNutrition.sugar / entryCount,
      fiber: totalNutrition.fiber / entryCount
    },
    macronutrientBalance: this._calculateMacronutrientBalance(totalNutrition, entryCount)
  };

  const micronutrientStatus = this._assessMicronutrientStatus(nutritionEntries);
  const healthRisks = this._identifyHealthRisks(nutritionalProfile);
  const personalizedRecommendations = this._generateRecommendations(nutritionalProfile, micronutrientStatus);

  return {
    nutritionalProfile,
    micronutrientStatus,
    healthRisks,
    personalizedRecommendations,
    lastAnalysisDate: new Date()
  };
};

// Calculate macronutrient balance
NutritionInsightsSchema.statics._calculateMacronutrientBalance = function(totalNutrition, entryCount) {
  const totalCalories = (
    (totalNutrition.protein * 4) + 
    (totalNutrition.carbohydrates * 4) + 
    (totalNutrition.fat * 9)
  ) / entryCount;

  return {
    proteinPercentage: Math.round((totalNutrition.protein * 4 / totalCalories) * 100),
    carbPercentage: Math.round((totalNutrition.carbohydrates * 4 / totalCalories) * 100),
    fatPercentage: Math.round((totalNutrition.fat * 9 / totalCalories) * 100)
  };
};

// Assess micronutrient status
NutritionInsightsSchema.statics._assessMicronutrientStatus = function(nutritionEntries) {
  // Placeholder implementation - in a real-world scenario, 
  // this would use more sophisticated analysis
  return {
    vitamins: [
      { 
        name: 'Vitamin D', 
        level: 'Low', 
        currentValue: 15, 
        recommendedValue: 50 
      }
    ],
    minerals: [
      { 
        name: 'Iron', 
        level: 'Optimal', 
        currentValue: 18, 
        recommendedValue: 18 
      }
    ]
  };
};

// Identify potential health risks
NutritionInsightsSchema.statics._identifyHealthRisks = function(nutritionalProfile) {
  const risks = [];

  // Example risk identification logic
  if (nutritionalProfile.averageDailyIntake.sugar > 50) {
    risks.push({
      type: 'Metabolic Imbalance',
      severity: 'High',
      details: 'High sugar intake detected',
      recommendedActions: [
        'Reduce added sugar consumption',
        'Choose whole foods over processed snacks'
      ]
    });
  }

  if (nutritionalProfile.macronutrientBalance.fatPercentage > 35) {
    risks.push({
      type: 'Cardiovascular Risk',
      severity: 'Moderate',
      details: 'High fat intake detected',
      recommendedActions: [
        'Choose healthier fat sources',
        'Increase physical activity'
      ]
    });
  }

  return risks;
};

// Generate personalized recommendations
NutritionInsightsSchema.statics._generateRecommendations = function(nutritionalProfile, micronutrientStatus) {
  const recommendations = [];

  // Nutrition recommendations
  if (nutritionalProfile.averageDailyIntake.fiber < 25) {
    recommendations.push({
      category: 'Nutrition',
      recommendation: 'Increase fiber intake',
      rationale: 'Current fiber intake is below recommended levels',
      confidenceScore: 0.8
    });
  }

  // Supplementation recommendations
  const vitaminDStatus = micronutrientStatus.vitamins.find(v => v.name === 'Vitamin D');
  if (vitaminDStatus && vitaminDStatus.level === 'Low') {
    recommendations.push({
      category: 'Supplementation',
      recommendation: 'Consider Vitamin D supplement',
      rationale: 'Low Vitamin D levels detected',
      confidenceScore: 0.9
    });
  }

  return recommendations;
};

module.exports = mongoose.model('NutritionInsights', NutritionInsightsSchema);
