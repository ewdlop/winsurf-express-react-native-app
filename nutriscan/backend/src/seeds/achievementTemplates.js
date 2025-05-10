const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');

const achievementTemplates = [
  // Nutrition Achievements
  {
    title: 'Nutrition Novice',
    description: 'Log your first 5 nutrition entries',
    category: 'Nutrition',
    difficultyLevel: 'Bronze',
    points: 10,
    criteria: {
      nutritionEntriesCount: 5
    }
  },
  {
    title: 'Balanced Diet Master',
    description: 'Maintain a balanced diet for 30 consecutive days',
    category: 'Nutrition',
    difficultyLevel: 'Gold',
    points: 50,
    criteria: {
      consecutiveDaysBalancedDiet: 30
    }
  },
  
  // Fitness Achievements
  {
    title: 'First Steps',
    description: 'Log your first fitness activity',
    category: 'Fitness',
    difficultyLevel: 'Bronze',
    points: 10,
    criteria: {
      fitnessActivitiesCount: 1
    }
  },
  {
    title: 'Fitness Enthusiast',
    description: 'Complete 50 fitness activities',
    category: 'Fitness',
    difficultyLevel: 'Silver',
    points: 30,
    criteria: {
      fitnessActivitiesCount: 50
    }
  },
  
  // Wellness Achievements
  {
    title: 'Mindfulness Beginner',
    description: 'Practice meditation for 7 consecutive days',
    category: 'Wellness',
    difficultyLevel: 'Bronze',
    points: 15,
    criteria: {
      meditationDays: 7
    }
  },
  {
    title: 'Stress Management Pro',
    description: 'Maintain low stress levels for 30 consecutive days',
    category: 'Wellness',
    difficultyLevel: 'Platinum',
    points: 75,
    criteria: {
      lowStressDays: 30
    }
  },
  
  // Community Achievements
  {
    title: 'Social Butterfly',
    description: 'Make your first 5 connections',
    category: 'Community',
    difficultyLevel: 'Bronze',
    points: 20,
    criteria: {
      socialConnectionsCount: 5
    }
  },
  {
    title: 'Community Leader',
    description: 'Create 10 community posts',
    category: 'Community',
    difficultyLevel: 'Silver',
    points: 40,
    criteria: {
      communityPostsCount: 10
    }
  },
  
  // Personal Growth Achievements
  {
    title: 'Goal Setter',
    description: 'Create your first health goal',
    category: 'Personal Growth',
    difficultyLevel: 'Bronze',
    points: 10,
    criteria: {
      healthGoalsCount: 1
    }
  },
  {
    title: 'Persistent Achiever',
    description: 'Complete 5 health goals',
    category: 'Personal Growth',
    difficultyLevel: 'Gold',
    points: 60,
    criteria: {
      completedHealthGoalsCount: 5
    }
  }
];

async function seedAchievementTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing templates
    await Achievement.deleteMany({});

    // Insert new templates
    const createdTemplates = await Achievement.insertMany(achievementTemplates);
    
    console.log(`Seeded ${createdTemplates.length} achievement templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding achievement templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedAchievementTemplates();
}

module.exports = seedAchievementTemplates;
