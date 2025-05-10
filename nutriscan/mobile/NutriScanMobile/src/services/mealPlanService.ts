import api from './api';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Meal {
  name: string;
  ingredients: Ingredient[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  sourceUrl?: string;
}

export interface MealPlan {
  _id?: string;
  user: string;
  name: string;
  startDate: Date;
  endDate: Date;
  goal: string;
  meals: {
    day: Date;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    foods: {
      foodName: string;
      servingSize: {
        amount: number;
        unit: string;
      };
      nutritionalInfo: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
      };
      recipeUrl?: string;
    }[];
  }[];
}

export interface MealPlanGenerationOptions {
  timeFrame?: 'day' | 'week';
  calories?: number;
  diet?: string;
  exclude?: string[];
}

class MealPlanService {
  static async generateMealPlan(options: MealPlanGenerationOptions): Promise<MealPlan> {
    try {
      const response = await api.post('/meal-plans/generate', options);
      return response.data;
    } catch (error) {
      console.error('Generate meal plan error:', error);
      throw error;
    }
  }

  static async getUserMealPlans(page = 1, limit = 10): Promise<{ mealPlans: MealPlan[], totalPages: number, currentPage: number }> {
    try {
      const response = await api.get('/meal-plans', { 
        params: { page, limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Get user meal plans error:', error);
      throw error;
    }
  }

  static async getMealPlanById(mealPlanId: string): Promise<MealPlan> {
    try {
      const response = await api.get(`/meal-plans/${mealPlanId}`);
      return response.data;
    } catch (error) {
      console.error('Get meal plan by ID error:', error);
      throw error;
    }
  }

  static async deleteMealPlan(mealPlanId: string): Promise<void> {
    try {
      await api.delete(`/meal-plans/${mealPlanId}`);
    } catch (error) {
      console.error('Delete meal plan error:', error);
      throw error;
    }
  }
}

export default MealPlanService;
