const mongoose = require('mongoose');

const HealthGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'Weight Loss', 
      'Weight Gain', 
      'Muscle Gain', 
      'Body Fat Reduction', 
      'Cardiovascular Fitness', 
      'Nutrition Improvement'
    ],
    required: true
  },
  target: {
    metric: {
      type: String,
      enum: ['Weight', 'Body Fat %', 'Muscle Mass', 'Calories', 'Nutrients']
    },
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', '%', 'calories']
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  progressEntries: [{
    date: {
      type: Date,
      default: Date.now
    },
    currentValue: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Abandoned'],
    default: 'Active'
  },
  motivationalQuote: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
HealthGoalSchema.index({ user: 1, type: 1, startDate: -1 });

// Static method to calculate goal progress
HealthGoalSchema.statics.calculateProgress = function(goalId) {
  return this.findById(goalId).then(goal => {
    if (!goal) {
      throw new Error('Health goal not found');
    }

    const latestEntry = goal.progressEntries[goal.progressEntries.length - 1];
    const firstEntry = goal.progressEntries[0];

    const totalProgress = latestEntry.currentValue - firstEntry.currentValue;
    const progressPercentage = Math.abs(
      (totalProgress / Math.abs(goal.target.value)) * 100
    );

    const daysTotal = (goal.targetDate - goal.startDate) / (1000 * 60 * 60 * 24);
    const daysPassed = (new Date() - goal.startDate) / (1000 * 60 * 60 * 24);
    const expectedProgressPercentage = (daysPassed / daysTotal) * 100;

    return {
      currentValue: latestEntry.currentValue,
      targetValue: goal.target.value,
      totalProgress,
      progressPercentage: Math.min(progressPercentage, 100),
      expectedProgressPercentage: Math.min(expectedProgressPercentage, 100),
      status: goal.status
    };
  });
};

// Method to add progress entry
HealthGoalSchema.methods.addProgressEntry = function(currentValue, notes = '') {
  this.progressEntries.push({
    currentValue,
    notes
  });

  // Update goal status if target is reached
  if (this.progressEntries.length > 0) {
    const latestEntry = this.progressEntries[this.progressEntries.length - 1];
    
    if (this.type === 'Weight Loss' && latestEntry.currentValue <= this.target.value) {
      this.status = 'Completed';
    }
    
    if (this.type === 'Weight Gain' && latestEntry.currentValue >= this.target.value) {
      this.status = 'Completed';
    }
  }

  return this.save();
};

module.exports = mongoose.model('HealthGoal', HealthGoalSchema);
