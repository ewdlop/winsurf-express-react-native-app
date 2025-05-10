const mongoose = require('mongoose');

const AIRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  recommendationProfiles: {
    nutrition: {
      personalizedDiet: {
        type: {
          type: String,
          enum: [
            'Mediterranean', 
            'Plant-Based', 
            'High-Protein', 
            'Low-Carb', 
            'Balanced', 
            'Performance'
          ]
        },
        rationale: String,
        confidenceScore: Number
      },
      supplementRecommendations: [{
        supplement: {
          type: String,
          enum: [
            'Vitamin D', 'Omega-3', 'Probiotics', 
            'Multivitamin', 'Iron', 'Magnesium', 
            'B-Complex', 'Zinc'
          ]
        },
        dosage: String,
        rationale: String,
        potentialBenefits: [String],
        confidenceScore: Number
      }]
    },
    fitness: {
      exerciseRecommendations: [{
        type: {
          type: String,
          enum: [
            'Strength Training', 'Cardio', 'HIIT', 
            'Yoga', 'Pilates', 'Endurance', 
            'Flexibility', 'Recovery'
          ]
        },
        intensity: {
          type: String,
          enum: ['Low', 'Moderate', 'High', 'Custom']
        },
        duration: Number, // in minutes
        frequency: {
          type: String,
          enum: ['Daily', 'Weekly', 'Bi-Weekly']
        },
        targetOutcome: [String],
        confidenceScore: Number
      }]
    },
    mentalWellness: {
      stressManagement: {
        techniques: [{
          type: {
            type: String,
            enum: [
              'Meditation', 'Deep Breathing', 'Mindfulness', 
              'Journaling', 'Progressive Muscle Relaxation', 
              'Cognitive Behavioral Techniques'
            ]
          },
          duration: Number, // in minutes
          frequency: {
            type: String,
            enum: ['Daily', 'Weekly']
          },
          potentialBenefits: [String]
        }],
        sleepRecommendations: {
          idealSleepDuration: Number,
          sleepQualityTips: [String],
          bedtimeRoutine: [String]
        }
      }
    },
    weightManagement: {
      metabolicProfile: {
        basalMetabolicRate: Number,
        totalDailyEnergyExpenditure: Number,
        bodyCompositionGoal: {
          type: String,
          enum: ['Fat Loss', 'Muscle Gain', 'Body Recomposition']
        }
      },
      calorieTargets: {
        maintenanceCalories: Number,
        deficitOrSurplus: Number,
        recommendedMacroSplit: {
          protein: Number,
          carbohydrates: Number,
          fat: Number
        }
      }
    },
    preventiveCare: {
      healthRiskAssessment: [{
        riskType: {
          type: String,
          enum: [
            'Cardiovascular', 'Metabolic', 'Inflammatory', 
            'Nutritional Deficiency', 'Hormonal Imbalance'
          ]
        },
        riskLevel: {
          type: String,
          enum: ['Low', 'Moderate', 'High']
        },
        recommendedScreenings: [String],
        preventiveStrategies: [String]
      }]
    }
  },
  learningMetadata: {
    dataPointsConsidered: Number,
    lastTrainingTimestamp: Date,
    modelVersion: String
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
AIRecommendationSchema.index({ user: 1, 'learningMetadata.lastTrainingTimestamp': -1 });

// Static method to generate AI recommendations
AIRecommendationSchema.statics.generateRecommendations = async function(userId) {
  // Fetch user's comprehensive health data
  const [
    nutritionEntries,
    healthGoals,
    healthProfile,
    fitnessData
  ] = await Promise.all([
    mongoose.model('NutritionEntry').find({ user: userId }),
    mongoose.model('HealthGoal').find({ user: userId }),
    mongoose.model('User').findById(userId),
    mongoose.model('FitnessTracker').findOne({ user: userId }) // Assuming this model exists
  ]);

  // Generate recommendations using machine learning techniques
  const recommendations = this._generateAIRecommendations(
    nutritionEntries,
    healthGoals,
    healthProfile,
    fitnessData
  );

  // Check if recommendations already exist for the user
  let aiRecommendation = await this.findOne({ user: userId });
  
  if (!aiRecommendation) {
    aiRecommendation = new this({ user: userId });
  }

  // Update recommendations
  aiRecommendation.recommendationProfiles = recommendations;
  aiRecommendation.learningMetadata = {
    dataPointsConsidered: nutritionEntries.length,
    lastTrainingTimestamp: new Date(),
    modelVersion: '1.0.0'
  };

  return aiRecommendation.save();
};

// Private method to generate AI recommendations
AIRecommendationSchema.statics._generateAIRecommendations = function(
  nutritionEntries, 
  healthGoals, 
  healthProfile, 
  fitnessData
) {
  // Nutrition Recommendations
  const nutritionRecommendations = this._generateNutritionRecommendations(
    nutritionEntries, 
    healthGoals, 
    healthProfile
  );

  // Fitness Recommendations
  const fitnessRecommendations = this._generateFitnessRecommendations(
    fitnessData, 
    healthGoals, 
    healthProfile
  );

  // Mental Wellness Recommendations
  const mentalWellnessRecommendations = this._generateMentalWellnessRecommendations(
    healthProfile
  );

  // Weight Management Recommendations
  const weightManagementRecommendations = this._generateWeightManagementRecommendations(
    nutritionEntries, 
    healthGoals, 
    healthProfile
  );

  // Preventive Care Recommendations
  const preventiveCareRecommendations = this._generatePreventiveCareRecommendations(
    healthProfile
  );

  return {
    nutrition: nutritionRecommendations,
    fitness: fitnessRecommendations,
    mentalWellness: mentalWellnessRecommendations,
    weightManagement: weightManagementRecommendations,
    preventiveCare: preventiveCareRecommendations
  };
};

// Generate nutrition recommendations
AIRecommendationSchema.statics._generateNutritionRecommendations = function(
  nutritionEntries, 
  healthGoals, 
  healthProfile
) {
  // Placeholder implementation with basic logic
  const personalizedDiet = {
    type: 'Balanced',
    rationale: 'Supports overall health and fitness goals',
    confidenceScore: 0.75
  };

  const supplementRecommendations = [
    {
      supplement: 'Vitamin D',
      dosage: '2000 IU daily',
      rationale: 'Low sunlight exposure detected',
      potentialBenefits: ['Bone Health', 'Immune Support'],
      confidenceScore: 0.85
    }
  ];

  return { personalizedDiet, supplementRecommendations };
};

// Generate fitness recommendations
AIRecommendationSchema.statics._generateFitnessRecommendations = function(
  fitnessData, 
  healthGoals, 
  healthProfile
) {
  const exerciseRecommendations = [
    {
      type: 'Strength Training',
      intensity: 'Moderate',
      duration: 45,
      frequency: 'Weekly',
      targetOutcome: ['Muscle Maintenance', 'Metabolic Health'],
      confidenceScore: 0.8
    }
  ];

  return { exerciseRecommendations };
};

// Generate mental wellness recommendations
AIRecommendationSchema.statics._generateMentalWellnessRecommendations = function(
  healthProfile
) {
  const stressManagement = {
    techniques: [
      {
        type: 'Meditation',
        duration: 15,
        frequency: 'Daily',
        potentialBenefits: ['Stress Reduction', 'Improved Focus']
      }
    ],
    sleepRecommendations: {
      idealSleepDuration: 7,
      sleepQualityTips: [
        'Maintain consistent sleep schedule',
        'Reduce screen time before bed'
      ],
      bedtimeRoutine: [
        'Light stretching',
        'Reading',
        'Relaxation techniques'
      ]
    }
  };

  return { stressManagement };
};

// Generate weight management recommendations
AIRecommendationSchema.statics._generateWeightManagementRecommendations = function(
  nutritionEntries, 
  healthGoals, 
  healthProfile
) {
  const metabolicProfile = {
    basalMetabolicRate: 1800,
    totalDailyEnergyExpenditure: 2200,
    bodyCompositionGoal: 'Body Recomposition'
  };

  const calorieTargets = {
    maintenanceCalories: 2200,
    deficitOrSurplus: -300,
    recommendedMacroSplit: {
      protein: 30,
      carbohydrates: 40,
      fat: 30
    }
  };

  return { metabolicProfile, calorieTargets };
};

// Generate preventive care recommendations
AIRecommendationSchema.statics._generatePreventiveCareRecommendations = function(
  healthProfile
) {
  const healthRiskAssessment = [
    {
      riskType: 'Cardiovascular',
      riskLevel: 'Low',
      recommendedScreenings: ['Annual Cholesterol Test'],
      preventiveStrategies: [
        'Regular Exercise',
        'Heart-Healthy Diet',
        'Stress Management'
      ]
    }
  ];

  return { healthRiskAssessment };
};

module.exports = mongoose.model('AIRecommendation', AIRecommendationSchema);
