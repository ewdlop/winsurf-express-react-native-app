const mongoose = require('mongoose');
const { Reward } = require('../models/Reward');

const rewardTemplates = [
  // Health Products
  {
    title: 'Nutrition Starter Kit',
    description: 'Premium supplement bundle for optimal nutrition',
    type: 'HealthProduct',
    difficultyLevel: 'Easy',
    requiredPoints: 500,
    redemptionCriteria: {
      nutritionEntriesCount: 10
    },
    sponsoredBy: 'NutriWell Supplements'
  },
  {
    title: 'Advanced Fitness Gear',
    description: 'High-end fitness tracking and training equipment',
    type: 'HealthProduct',
    difficultyLevel: 'Hard',
    requiredPoints: 2000,
    redemptionCriteria: {
      fitnessActivitiesCount: 50
    },
    sponsoredBy: 'FitTech Innovations'
  },
  
  // Consultations
  {
    title: 'Nutrition Consultation',
    description: '1-hour personalized nutrition consultation with a dietitian',
    type: 'NutritionConsultation',
    difficultyLevel: 'Medium',
    requiredPoints: 1000,
    redemptionCriteria: {
      consecutiveDaysBalancedDiet: 15
    }
  },
  {
    title: 'Wellness Coaching Session',
    description: 'Comprehensive wellness and lifestyle coaching',
    type: 'NutritionConsultation',
    difficultyLevel: 'Hard',
    requiredPoints: 2500,
    redemptionCriteria: {
      lowStressDays: 30
    }
  },
  
  // Fitness Classes
  {
    title: 'Virtual Yoga Workshop',
    description: '4-week online yoga and mindfulness program',
    type: 'FitnessClass',
    difficultyLevel: 'Easy',
    requiredPoints: 750,
    redemptionCriteria: {
      meditationDays: 10
    }
  },
  {
    title: 'Personal Training Package',
    description: '5 personalized online training sessions',
    type: 'FitnessClass',
    difficultyLevel: 'Epic',
    requiredPoints: 3000,
    redemptionCriteria: {
      fitnessActivitiesCount: 75
    }
  },
  
  // Meal Plans
  {
    title: 'Custom Meal Plan',
    description: 'Personalized 2-week meal plan tailored to your goals',
    type: 'MealPlan',
    difficultyLevel: 'Medium',
    requiredPoints: 1250,
    redemptionCriteria: {
      nutritionEntriesCount: 25
    }
  },
  {
    title: 'Gourmet Nutrition Plan',
    description: 'Luxury 4-week gourmet nutrition program',
    type: 'MealPlan',
    difficultyLevel: 'Epic',
    requiredPoints: 3500,
    redemptionCriteria: {
      consecutiveDaysBalancedDiet: 45
    }
  },
  
  // Digital Badges
  {
    title: 'Nutrition Pioneer Badge',
    description: 'Exclusive digital badge for early nutrition tracking champions',
    type: 'DigitalBadge',
    difficultyLevel: 'Easy',
    requiredPoints: 250,
    redemptionCriteria: {
      nutritionEntriesCount: 5
    }
  },
  {
    title: 'Community Leader Badge',
    description: 'Prestigious badge for top community contributors',
    type: 'DigitalBadge',
    difficultyLevel: 'Hard',
    requiredPoints: 2000,
    redemptionCriteria: {
      communityPostsCount: 20
    }
  },
  
  // Virtual Trophies
  {
    title: 'Wellness Warrior Trophy',
    description: 'Epic virtual trophy for holistic health champions',
    type: 'VirtualTrophy',
    difficultyLevel: 'Epic',
    requiredPoints: 4000,
    redemptionCriteria: {
      completedHealthGoalsCount: 10
    }
  },
  
  // Discounts
  {
    title: '20% Off NutriScan Pro',
    description: 'Exclusive discount on NutriScan Pro subscription',
    type: 'Discount',
    difficultyLevel: 'Medium',
    requiredPoints: 1500,
    redemptionCriteria: {
      healthGoalsCount: 3
    }
  },
  
  // Exclusive Content
  {
    title: 'Expert Nutrition Masterclass',
    description: 'Exclusive access to advanced nutrition masterclass',
    type: 'ExclusiveContent',
    difficultyLevel: 'Hard',
    requiredPoints: 2750,
    redemptionCriteria: {
      consecutiveDaysBalancedDiet: 30
    }
  }
];

async function seedRewardTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing templates
    await Reward.deleteMany({});

    // Insert new templates
    const createdTemplates = await Reward.insertMany(rewardTemplates);
    
    console.log(`Seeded ${createdTemplates.length} reward templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding reward templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedRewardTemplates();
}

module.exports = seedRewardTemplates;
