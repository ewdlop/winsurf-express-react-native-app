const { 
  HealthRiskAssessment, 
  RiskCategoryEnum, 
  RiskLevelEnum,
  HealthIndicatorTypeEnum
} = require('../models/HealthRiskAssessment');
const User = require('../models/User');
const HealthGoal = require('../models/HealthGoal');
const { NotFoundError, ValidationError } = require('../utils/customErrors');

class HealthRiskAssessmentService {
  // Create a comprehensive health risk assessment
  static async createHealthRiskAssessment(userId, healthData) {
    try {
      // Validate input
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Validate health indicators
      const validatedHealthIndicators = this.validateHealthIndicators(healthData.healthIndicators);

      // Calculate overall risk score
      const riskScore = HealthRiskAssessment.calculateRiskScore(validatedHealthIndicators);

      // Determine overall risk level
      const overallRiskLevel = this.determineRiskLevel(riskScore);

      // Generate risk categories
      const riskCategories = this.generateRiskCategories(riskScore);

      // Generate predictive insights
      const predictiveInsights = HealthRiskAssessment.generatePredictiveInsights(
        riskScore, 
        validatedHealthIndicators
      );

      // Create health risk assessment
      const assessmentData = {
        user: userId,
        overallRiskProfile: {
          level: overallRiskLevel,
          score: riskScore
        },
        riskCategories,
        healthIndicators: validatedHealthIndicators,
        predictiveInsights,
        metadata: healthData.metadata || {}
      };

      const assessment = await HealthRiskAssessment.createAssessment(assessmentData);

      return assessment;
    } catch (error) {
      throw error;
    }
  }

  // Validate health indicators
  static validateHealthIndicators(healthIndicators) {
    const referenceRanges = {
      'BloodPressure': { min: [90, 60], max: [140, 90] },
      'Cholesterol': { min: 0, max: 200 },
      'BloodSugar': { min: 70, max: 140 },
      'BMI': { min: 18.5, max: 25 },
      'WaistCircumference': { min: 0, max: 40 },
      'BodyFatPercentage': { min: 10, max: 30 },
      'RestingHeartRate': { min: 60, max: 100 }
    };

    return healthIndicators.map(indicator => {
      if (!HealthIndicatorTypeEnum.includes(indicator.type)) {
        throw new ValidationError(`Invalid health indicator type: ${indicator.type}`);
      }

      const referenceRange = referenceRanges[indicator.type];
      
      let status = 'Normal';
      if (referenceRange) {
        if (
          (Array.isArray(indicator.value) && 
            (indicator.value[0] > referenceRange.max[0] || indicator.value[1] > referenceRange.max[1])) ||
          (!Array.isArray(indicator.value) && indicator.value > referenceRange.max)
        ) {
          status = 'Abnormal';
        } else if (
          (Array.isArray(indicator.value) && 
            (indicator.value[0] < referenceRange.min[0] || indicator.value[1] < referenceRange.min[1])) ||
          (!Array.isArray(indicator.value) && indicator.value < referenceRange.min)
        ) {
          status = 'Borderline';
        }
      }

      return {
        ...indicator,
        referenceRange,
        status
      };
    });
  }

  // Determine risk level based on risk score
  static determineRiskLevel(riskScore) {
    if (riskScore >= 75) return 'Critical';
    if (riskScore >= 50) return 'High';
    if (riskScore >= 25) return 'Moderate';
    return 'Low';
  }

  // Generate risk categories
  static generateRiskCategories(riskScore) {
    const categories = [
      { 
        category: 'Cardiovascular', 
        riskLevel: this.determineRiskLevel(riskScore * 0.3),
        riskScore: Math.round(riskScore * 0.3)
      },
      { 
        category: 'Metabolic', 
        riskLevel: this.determineRiskLevel(riskScore * 0.25),
        riskScore: Math.round(riskScore * 0.25)
      },
      { 
        category: 'Nutritional', 
        riskLevel: this.determineRiskLevel(riskScore * 0.2),
        riskScore: Math.round(riskScore * 0.2)
      },
      { 
        category: 'Lifestyle', 
        riskLevel: this.determineRiskLevel(riskScore * 0.15),
        riskScore: Math.round(riskScore * 0.15)
      },
      { 
        category: 'Mental Health', 
        riskLevel: this.determineRiskLevel(riskScore * 0.1),
        riskScore: Math.round(riskScore * 0.1)
      }
    ];

    return categories;
  }

  // Get historical health risk assessments
  static async getHistoricalAssessments(userId, options = {}) {
    try {
      const historicalAssessments = await HealthRiskAssessment.getHistoricalAssessments(
        userId, 
        options
      );

      return historicalAssessments;
    } catch (error) {
      throw error;
    }
  }

  // Generate personalized health improvement recommendations
  static async generateHealthImprovementRecommendations(userId) {
    try {
      // Get the latest health risk assessment
      const latestAssessment = await HealthRiskAssessment.findOne({ user: userId })
        .sort({ assessmentDate: -1 })
        .limit(1);

      if (!latestAssessment) {
        throw new NotFoundError('No health risk assessment found');
      }

      // Generate recommendations based on risk categories
      const recommendations = latestAssessment.riskCategories.map(category => {
        switch (category.category) {
          case 'Cardiovascular':
            return {
              category: 'Cardiovascular',
              recommendations: [
                'Increase cardiovascular exercise',
                'Reduce sodium intake',
                'Practice stress management techniques'
              ]
            };
          case 'Metabolic':
            return {
              category: 'Metabolic',
              recommendations: [
                'Optimize diet for blood sugar control',
                'Increase physical activity',
                'Consider consulting an endocrinologist'
              ]
            };
          case 'Nutritional':
            return {
              category: 'Nutritional',
              recommendations: [
                'Consult a nutritionist',
                'Take comprehensive nutritional supplements',
                'Improve dietary diversity'
              ]
            };
          case 'Lifestyle':
            return {
              category: 'Lifestyle',
              recommendations: [
                'Improve sleep hygiene',
                'Reduce alcohol consumption',
                'Implement regular exercise routine'
              ]
            };
          case 'Mental Health':
            return {
              category: 'Mental Health',
              recommendations: [
                'Practice mindfulness meditation',
                'Consider therapy or counseling',
                'Develop stress management strategies'
              ]
            };
          default:
            return null;
        }
      }).filter(rec => rec !== null);

      return {
        overallRiskLevel: latestAssessment.overallRiskProfile.level,
        recommendations
      };
    } catch (error) {
      throw error;
    }
  }

  // Advanced predictive health modeling
  static async predictHealthTrajectory(userId) {
    try {
      // Retrieve user's health history
      const historicalAssessments = await HealthRiskAssessment.find({ user: userId })
        .sort({ assessmentDate: 1 });

      if (historicalAssessments.length < 2) {
        throw new ValidationError('Insufficient historical data for prediction');
      }

      // Simple predictive modeling based on historical trends
      const trajectoryAnalysis = {
        overallRiskTrend: this.analyzeRiskTrend(historicalAssessments),
        categoryTrends: this.analyzeCategoryTrends(historicalAssessments),
        futureRiskProjection: this.projectFutureRisk(historicalAssessments)
      };

      return trajectoryAnalysis;
    } catch (error) {
      throw error;
    }
  }

  // Analyze overall risk trend
  static analyzeRiskTrend(assessments) {
    const riskScores = assessments.map(a => a.overallRiskProfile.score);
    const trend = this.calculateTrend(riskScores);

    return {
      direction: trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable',
      rate: Math.abs(trend)
    };
  }

  // Analyze risk trends for each category
  static analyzeCategoryTrends(assessments) {
    const categoryTrends = {};

    assessments[0].riskCategories.forEach(category => {
      const categoryScores = assessments.map(a => 
        a.riskCategories.find(c => c.category === category.category).riskScore
      );
      
      const trend = this.calculateTrend(categoryScores);
      
      categoryTrends[category.category] = {
        direction: trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable',
        rate: Math.abs(trend)
      };
    });

    return categoryTrends;
  }

  // Project future risk
  static projectFutureRisk(assessments) {
    const latestAssessment = assessments[assessments.length - 1];
    const overallTrend = this.analyzeRiskTrend(assessments);

    const projectedRiskScore = latestAssessment.overallRiskProfile.score + 
      (overallTrend.direction === 'Increasing' ? overallTrend.rate : -overallTrend.rate);

    return {
      currentRiskScore: latestAssessment.overallRiskProfile.score,
      projectedRiskScore: Math.min(Math.max(projectedRiskScore, 0), 100),
      projectedRiskLevel: this.determineRiskLevel(projectedRiskScore)
    };
  }

  // Calculate trend using simple linear regression
  static calculateTrend(values) {
    const n = values.length;
    const sumX = n * (n + 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, value, index) => sum + value * (index + 1), 0);
    const sumXSquare = n * (n + 1) * (2 * n + 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXSquare - sumX * sumX);
    return slope;
  }
}

module.exports = HealthRiskAssessmentService;
