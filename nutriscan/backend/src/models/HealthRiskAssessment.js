const mongoose = require('mongoose');

// Risk Categories
const RiskCategoryEnum = [
  'Cardiovascular', 
  'Metabolic', 
  'Nutritional', 
  'Lifestyle', 
  'Genetic', 
  'Mental Health',
  'Chronic Disease'
];

// Risk Levels
const RiskLevelEnum = [
  'Low', 
  'Moderate', 
  'High', 
  'Critical'
];

// Health Indicator Types
const HealthIndicatorTypeEnum = [
  'BloodPressure',
  'Cholesterol',
  'BloodSugar',
  'BMI',
  'WaistCircumference',
  'BodyFatPercentage',
  'RestingHeartRate',
  'SleepQuality',
  'StressLevel',
  'NutrientDeficiency'
];

const HealthRiskAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  overallRiskProfile: {
    level: {
      type: String,
      enum: RiskLevelEnum,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    }
  },
  riskCategories: [{
    category: {
      type: String,
      enum: RiskCategoryEnum,
      required: true
    },
    riskLevel: {
      type: String,
      enum: RiskLevelEnum,
      required: true
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    }
  }],
  healthIndicators: [{
    type: {
      type: String,
      enum: HealthIndicatorTypeEnum,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    referenceRange: {
      min: mongoose.Schema.Types.Mixed,
      max: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['Normal', 'Borderline', 'Abnormal'],
      required: true
    }
  }],
  predictiveInsights: [{
    condition: {
      type: String,
      trim: true
    },
    probabilityOfDevelopment: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendedActions: [{
      type: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      priority: {
        type: Number,
        default: 0
      }
    }]
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound index for efficient querying
HealthRiskAssessmentSchema.index({ user: 1, assessmentDate: -1 });
HealthRiskAssessmentSchema.index({ 'overallRiskProfile.level': 1 });

// Static method to create health risk assessment
HealthRiskAssessmentSchema.statics.createAssessment = async function(assessmentData) {
  try {
    const assessment = new this(assessmentData);
    return assessment.save();
  } catch (error) {
    throw error;
  }
};

// Static method to calculate risk score
HealthRiskAssessmentSchema.statics.calculateRiskScore = function(healthIndicators) {
  const riskWeights = {
    'BloodPressure': 0.15,
    'Cholesterol': 0.15,
    'BloodSugar': 0.2,
    'BMI': 0.1,
    'WaistCircumference': 0.1,
    'BodyFatPercentage': 0.1,
    'RestingHeartRate': 0.1,
    'SleepQuality': 0.05,
    'StressLevel': 0.05
  };

  const calculateIndicatorRisk = (indicator) => {
    const { type, value, referenceRange } = indicator;
    
    if (!riskWeights[type]) return 0;

    let indicatorRisk = 0;
    if (type === 'BloodPressure') {
      const [systolic, diastolic] = value;
      if (systolic > 140 || diastolic > 90) indicatorRisk = 80;
      else if (systolic > 130 || diastolic > 85) indicatorRisk = 50;
    } else if (referenceRange) {
      if (value > referenceRange.max) indicatorRisk = 80;
      else if (value < referenceRange.min) indicatorRisk = 60;
    }

    return indicatorRisk * riskWeights[type];
  };

  const totalRiskScore = healthIndicators.reduce(
    (score, indicator) => score + calculateIndicatorRisk(indicator), 
    0
  );

  return Math.min(Math.round(totalRiskScore), 100);
};

// Static method to generate predictive insights
HealthRiskAssessmentSchema.statics.generatePredictiveInsights = function(riskScore, healthIndicators) {
  const predictiveConditions = [
    {
      condition: 'Type 2 Diabetes',
      riskThresholds: {
        low: 20,
        moderate: 50,
        high: 75
      },
      recommendedActions: [
        { 
          type: 'Lifestyle', 
          description: 'Adopt low-glycemic diet', 
          priority: 1 
        },
        { 
          type: 'Exercise', 
          description: 'Increase physical activity', 
          priority: 2 
        }
      ]
    },
    {
      condition: 'Cardiovascular Disease',
      riskThresholds: {
        low: 25,
        moderate: 55,
        high: 80
      },
      recommendedActions: [
        { 
          type: 'Diet', 
          description: 'Reduce saturated fat intake', 
          priority: 1 
        },
        { 
          type: 'Screening', 
          description: 'Regular cardiovascular check-ups', 
          priority: 2 
        }
      ]
    }
  ];

  return predictiveConditions.map(condition => {
    let probabilityOfDevelopment = 0;
    
    if (riskScore >= condition.riskThresholds.high) {
      probabilityOfDevelopment = 80;
    } else if (riskScore >= condition.riskThresholds.moderate) {
      probabilityOfDevelopment = 50;
    } else if (riskScore >= condition.riskThresholds.low) {
      probabilityOfDevelopment = 25;
    }

    return {
      condition: condition.condition,
      probabilityOfDevelopment,
      recommendedActions: condition.recommendedActions
    };
  }).filter(insight => insight.probabilityOfDevelopment > 0);
};

// Static method to retrieve historical risk assessments
HealthRiskAssessmentSchema.statics.getHistoricalAssessments = async function(userId, options = {}) {
  const { 
    startDate = new Date(0), 
    endDate = new Date(),
    page = 1, 
    limit = 20 
  } = options;

  const query = {
    user: mongoose.Types.ObjectId(userId),
    assessmentDate: { 
      $gte: startDate, 
      $lte: endDate 
    }
  };

  const assessments = await this.find(query)
    .sort({ assessmentDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    assessments,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalAssessments: total
  };
};

module.exports = {
  HealthRiskAssessment: mongoose.model('HealthRiskAssessment', HealthRiskAssessmentSchema),
  RiskCategoryEnum,
  RiskLevelEnum,
  HealthIndicatorTypeEnum
};
