import api from './api';

export interface NutritionInsight {
  _id?: string;
  type: 'Micronutrient' | 'Macronutrient' | 'Dietary' | 'Health Risk';
  title: string;
  description: string;
  score: number;
  recommendation?: string;
  timestamp: Date;
}

export interface NutritionReport {
  overallNutritionScore: number;
  micronutrientStatus: {
    [key: string]: {
      current: number;
      recommended: number;
      status: 'Deficient' | 'Low' | 'Optimal' | 'High';
    };
  };
  macronutrientBalance: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  dietaryRecommendations: string[];
  healthRisks: string[];
}

class NutritionService {
  static async getNutritionInsights(): Promise<NutritionInsight[]> {
    try {
      const response = await api.get('/nutrition/insights');
      return response.data;
    } catch (error) {
      console.error('Get nutrition insights error:', error);
      throw error;
    }
  }

  static async getNutritionReport(): Promise<NutritionReport> {
    try {
      const response = await api.get('/nutrition/report');
      return response.data;
    } catch (error) {
      console.error('Get nutrition report error:', error);
      throw error;
    }
  }

  static async getSpecificNutritionInsight(insightType: string): Promise<NutritionInsight[]> {
    try {
      const response = await api.get(`/nutrition/insights/${insightType}`);
      return response.data;
    } catch (error) {
      console.error('Get specific nutrition insight error:', error);
      throw error;
    }
  }
}

export default NutritionService;
