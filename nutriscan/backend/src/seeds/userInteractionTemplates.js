const mongoose = require('mongoose');
const { UserInteraction } = require('../models/UserInteraction');
const User = require('../models/User');

async function seedUserInteractionTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Find some users to create interaction templates
    const users = await User.find().limit(10);

    // Create interaction templates
    const interactionTemplates = users.flatMap(user => [
      // Authentication Interactions
      {
        user: user._id,
        type: 'PageView',
        category: 'Authentication',
        feature: 'Login Page',
        action: 'View',
        duration: Math.floor(Math.random() * 10000),
        device: {
          type: ['Mobile', 'Desktop', 'Tablet'][Math.floor(Math.random() * 3)],
          platform: 'Web',
          browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
        }
      },
      // Health Goals Interactions
      {
        user: user._id,
        type: 'ButtonClick',
        category: 'HealthGoals',
        feature: 'Goal Creation',
        action: 'Create Goal',
        metadata: { goalType: 'Weight Loss' },
        duration: Math.floor(Math.random() * 5000),
        device: {
          type: ['Mobile', 'Desktop', 'Tablet'][Math.floor(Math.random() * 3)],
          platform: 'Web',
          browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
        }
      },
      // Nutrition Interactions
      {
        user: user._id,
        type: 'ContentInteraction',
        category: 'Nutrition',
        feature: 'Meal Planner',
        action: 'Generate Meal Plan',
        metadata: { dietaryPreference: 'Vegetarian' },
        duration: Math.floor(Math.random() * 15000),
        device: {
          type: ['Mobile', 'Desktop', 'Tablet'][Math.floor(Math.random() * 3)],
          platform: 'Web',
          browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
        }
      },
      // Community Interactions
      {
        user: user._id,
        type: 'SocialInteraction',
        category: 'Community',
        feature: 'Community Feed',
        action: 'Like Post',
        metadata: { postCategory: 'Fitness Tips' },
        duration: Math.floor(Math.random() * 3000),
        device: {
          type: ['Mobile', 'Desktop', 'Tablet'][Math.floor(Math.random() * 3)],
          platform: 'Web',
          browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
        }
      }
    ]);

    // Clear existing templates
    await UserInteraction.deleteMany({});

    // Insert new templates
    const createdTemplates = await UserInteraction.insertMany(interactionTemplates);
    
    console.log(`Seeded ${createdTemplates.length} user interaction templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding user interaction templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedUserInteractionTemplates();
}

module.exports = seedUserInteractionTemplates;
