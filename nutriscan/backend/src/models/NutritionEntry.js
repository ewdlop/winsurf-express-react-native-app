const mongoose = require('mongoose');

const NutritionEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  servingSize: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'ml', 'piece', 'cup', 'oz', 'lb']
    }
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    carbohydrates: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    fiber: {
      type: Number,
      default: 0
    },
    sugar: {
      type: Number,
      default: 0
    }
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    required: true
  },
  consumedAt: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Create a compound index for efficient querying
NutritionEntrySchema.index({ user: 1, consumedAt: -1 });

// Static method to calculate daily nutrition summary
NutritionEntrySchema.statics.getDailySummary = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const summary = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        consumedAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalCalories: { $sum: '$nutritionalInfo.calories' },
        totalProtein: { $sum: '$nutritionalInfo.protein' },
        totalCarbohydrates: { $sum: '$nutritionalInfo.carbohydrates' },
        totalFat: { $sum: '$nutritionalInfo.fat' },
        totalFiber: { $sum: '$nutritionalInfo.fiber' },
        totalSugar: { $sum: '$nutritionalInfo.sugar' },
        entries: { $push: '$$ROOT' }
      }
    }
  ]);

  return summary[0] || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbohydrates: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSugar: 0,
    entries: []
  };
};

module.exports = mongoose.model('NutritionEntry', NutritionEntrySchema);
