const mongoose = require('mongoose');
const { HealthRiskAssessment } = require('../models/HealthRiskAssessment');
const User = require('../models/User');

async function seedHealthRiskAssessmentTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Find some users to create health risk assessment templates
    const users = await User.find().limit(10);

    // Create health risk assessment templates
    const healthRiskAssessmentTemplates = users.map(user => {
      // Simulate health indicators
      const healthIndicators = [
        {
          type: 'BloodPressure',
          value: [130, 85],
          referenceRange: { min: [90, 60], max: [140, 90] }
        },
        {
          type: 'Cholesterol',
          value: 210,
          referenceRange: { min: 0, max: 200 }
        },
        {
          type: 'BloodSugar',
          value: 120,
          referenceRange: { min: 70, max: 140 }
        },
        {
          type: 'BMI',
          value: 26,
          referenceRange: { min: 18.5, max: 25 }
        },
        {
          type: 'WaistCircumference',
          value: 38,
          referenceRange: { min: 0, max: 40 }
        }
      ];

      // Calculate risk score
      const riskScore = HealthRiskAssessment.calculateRiskScore(healthIndicators);

      // Determine risk level
      const riskLevel = 
        riskScore >= 75 ? 'Critical' :
        riskScore >= 50 ? 'High' :
        riskScore >= 25 ? 'Moderate' : 'Low';

      // Generate risk categories
      const riskCategories = [
        { 
          category: 'Cardiovascular', 
          riskLevel: riskLevel,
          riskScore: Math.round(riskScore * 0.3)
        },
        { 
          category: 'Metabolic', 
          riskLevel: riskLevel,
          riskScore: Math.round(riskScore * 0.25)
        },
        { 
          category: 'Nutritional', 
          riskLevel: riskLevel,
          riskScore: Math.round(riskScore * 0.2)
        },
        { 
          category: 'Lifestyle', 
          riskLevel: riskLevel,
          riskScore: Math.round(riskScore * 0.15)
        },
        { 
          category: 'Mental Health', 
          riskLevel: riskLevel,
          riskScore: Math.round(riskScore * 0.1)
        }
      ];

      // Generate predictive insights
      const predictiveInsights = HealthRiskAssessment.generatePredictiveInsights(
        riskScore, 
        healthIndicators
      );

      return {
        user: user._id,
        assessmentDate: new Date(),
        overallRiskProfile: {
          level: riskLevel,
          score: riskScore
        },
        riskCategories,
        healthIndicators,
        predictiveInsights,
        metadata: {
          source: 'Seed Data',
          generatedAt: new Date()
        }
      };
    });

    // Clear existing templates
    await HealthRiskAssessment.deleteMany({});

    // Insert new templates
    const createdTemplates = await HealthRiskAssessment.insertMany(healthRiskAssessmentTemplates);
    
    console.log(`Seeded ${createdTemplates.length} health risk assessment templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding health risk assessment templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedHealthRiskAssessmentTemplates();
}

module.exports = seedHealthRiskAssessmentTemplates;
