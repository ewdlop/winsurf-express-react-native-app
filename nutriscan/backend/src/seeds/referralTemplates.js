const mongoose = require('mongoose');
const { Referral } = require('../models/Referral');
const User = require('../models/User');

async function seedReferralTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Find some users to create referral templates
    const users = await User.find().limit(5);

    // Create referral templates
    const referralTemplates = users.map(user => ({
      referrer: user._id,
      type: 'UserReferral',
      status: 'Pending',
      rewards: {
        referrerPoints: 100,
        referredUserPoints: 50
      },
      metadata: {
        referralChannel: ['Email', 'SMS', 'Social Media', 'Direct Link'][
          Math.floor(Math.random() * 4)
        ],
        trackingSource: [
          'Health Expo', 
          'Fitness Conference', 
          'Social Media Campaign', 
          'Wellness Webinar'
        ][Math.floor(Math.random() * 4)]
      }
    }));

    // Clear existing templates
    await Referral.deleteMany({});

    // Insert new templates
    const createdTemplates = await Referral.insertMany(referralTemplates);
    
    console.log(`Seeded ${createdTemplates.length} referral templates`);
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding referral templates:', error);
    process.exit(1);
  }
}

// Only run if this file is directly executed
if (require.main === module) {
  seedReferralTemplates();
}

module.exports = seedReferralTemplates;
