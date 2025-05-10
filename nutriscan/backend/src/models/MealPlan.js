const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  goal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintain Weight', 'Improve Nutrition'],
    required: true
  },
  dietaryRestrictions: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free']
  }],
  targetNutrition: {
    calories: {
      min: Number,
      max: Number
    },
    protein: {
      min: Number,
      max: Number
    },
    carbohydrates: {
      min: Number,
      max: Number
    },
    fat: {
      min: Number,
      max: Number
    }
  },
  meals: [{
    day: {
      type: Date,
      required: true
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      required: true
    },
    foods: [{
      foodName: {
        type: String,
        required: true
      },
      servingSize: {
        amount: {
          type: Number,
          required: true
        },
        unit: {
          type: String,
          required: true
        }
      },
      nutritionalInfo: {
        calories: Number,
        protein: Number,
        carbohydrates: Number,
        fat: Number
      },
      recipeUrl: String
    }]
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
MealPlanSchema.index({ user: 1, startDate: -1 });

// Static method to calculate meal plan nutritional summary
MealPlanSchema.statics.calculateNutritionSummary = async function(mealPlanId) {
  const mealPlan = await this.findById(mealPlanId);
  
  if (!mealPlan) {
    throw new Error('Meal plan not found');
  }

  const summary = mealPlan.meals.reduce((acc, meal) => {
    meal.foods.forEach(food => {
      acc.totalCalories += food.nutritionalInfo.calories || 0;
      acc.totalProtein += food.nutritionalInfo.protein || 0;
      acc.totalCarbohydrates += food.nutritionalInfo.carbohydrates || 0;
      acc.totalFat += food.nutritionalInfo.fat || 0;
    });
    return acc;
  }, {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbohydrates: 0,
    totalFat: 0
  });

  return summary;
};

module.exports = mongoose.model('MealPlan', MealPlanSchema);
