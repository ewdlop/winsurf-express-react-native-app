const mongoose = require('mongoose');
const { Recommendation } = require('../models/Recommendation');
const User = require('../models/User');

async function seedRecommendationTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Find some users to create recommendation templates
    const users = await User.find().limit(10);

    // Create recommendation templates
    const recommendationTemplates = users.flatMap(user => [
      // Nutrition Recommendations
      {
        user: user._id,
        category: 'Nutrition',
        type: 'Personalized',
        title: 'Balanced Meal Strategy',
        description: 'Optimize your nutrition for better health and performance',
        confidenceLevel: 'High',
        relevanceScore: 85,
        actionItems: [
          { 
            type: 'MealPlanning', 
            description: 'Create balanced weekly meal plan', 
            priority: 1 
          }
        ],
        tags: ['nutrition', 'meal-planning', 'health-optimization'],
        metadata: {
          dietaryGoals: ['Weight Management', 'Muscle Gain'],
          nutritionalFocus: ['Protein Intake', 'Micronutrient Balance']
        }
      },
      // Fitness Recommendations
      {
        user: user._id,
        category: 'Fitness',
        type: 'Contextual',
        title: 'Adaptive Workout Plan',
        description: 'Personalized workout strategy based on your fitness level',
        confidenceLevel: 'Medium',
        relevanceScore: 75,
        actionItems: [
          { 
            type: 'WorkoutPlan', 
            description: 'Design progressive workout routine', 
            priority: 2 
          }
        ],
        tags: ['fitness', 'workout', 'personal-training'],
        metadata: {
          fitnessGoals: ['Strength Training', 'Endurance'],
          intensityLevel: 'Moderate'
        }
      },
      // Health Goal Recommendations
      {
        user: user._id,
        category: 'HealthGoals',
        type: 'Expert',
        title: 'Goal Achievement Strategies',
        description: 'Expert-backed techniques to accelerate your health goals',
        confidenceLevel: 'High',
        relevanceScore: 80,
        actionItems: [
          { 
            type: 'GoalTracking', 
            description: 'Set SMART milestones', 
            priority: 1 
          }
        ],
        tags: ['goal-setting', 'personal-development', 'motivation'],
        metadata: {
          goalTypes: ['Weight Loss', 'Muscle Gain', 'Wellness'],
          supportResources: ['Coaching', 'Community Support']
        }
      }
    ]);

    // Clear existing templates
    await Recommendation.deleteMany({});

    // Insert new templates
    const createdTemplates = await Recommendation.insertMany(recommendationTemplates);
    
    console.log(`Seeded ${createdTemplates.length} recommendation templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding recommendation templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedRecommendationTemplates();
}

module.exports = seedRecommendationTemplates;
