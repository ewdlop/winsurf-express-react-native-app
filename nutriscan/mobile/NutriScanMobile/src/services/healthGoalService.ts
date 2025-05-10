import api from './api';

export interface HealthGoal {
  _id?: string;
  title: string;
  description?: string;
  type: 'Weight Loss' | 'Muscle Gain' | 'Nutrition' | 'Fitness' | 'Overall Health';
  targetValue: number;
  currentValue?: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: 'Active' | 'Completed' | 'Paused';
}

export interface ProgressEntry {
  date: Date;
  value: number;
  notes?: string;
}

class HealthGoalService {
  static async createHealthGoal(goal: HealthGoal): Promise<HealthGoal> {
    try {
      const response = await api.post('/health-goals', goal);
      return response.data;
    } catch (error) {
      console.error('Create health goal error:', error);
      throw error;
    }
  }

  static async getUserHealthGoals(): Promise<HealthGoal[]> {
    try {
      const response = await api.get('/health-goals');
      return response.data;
    } catch (error) {
      console.error('Get health goals error:', error);
      throw error;
    }
  }

  static async getHealthGoalById(goalId: string): Promise<HealthGoal> {
    try {
      const response = await api.get(`/health-goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Get health goal by ID error:', error);
      throw error;
    }
  }

  static async updateHealthGoal(goalId: string, goalData: Partial<HealthGoal>): Promise<HealthGoal> {
    try {
      const response = await api.patch(`/health-goals/${goalId}`, goalData);
      return response.data;
    } catch (error) {
      console.error('Update health goal error:', error);
      throw error;
    }
  }

  static async deleteHealthGoal(goalId: string): Promise<void> {
    try {
      await api.delete(`/health-goals/${goalId}`);
    } catch (error) {
      console.error('Delete health goal error:', error);
      throw error;
    }
  }

  static async addProgressToGoal(goalId: string, progress: ProgressEntry): Promise<HealthGoal> {
    try {
      const response = await api.post(`/health-goals/${goalId}/progress`, progress);
      return response.data;
    } catch (error) {
      console.error('Add progress to goal error:', error);
      throw error;
    }
  }

  static async getGoalRecommendations(): Promise<HealthGoal[]> {
    try {
      const response = await api.get('/health-goals/recommendations');
      return response.data;
    } catch (error) {
      console.error('Get goal recommendations error:', error);
      throw error;
    }
  }
}

export default HealthGoalService;
