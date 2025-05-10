import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HealthGoal } from '../../services/healthGoalService';

interface HealthGoalState {
  goals: HealthGoal[];
  selectedGoal: HealthGoal | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: HealthGoalState = {
  goals: [],
  selectedGoal: null,
  isLoading: false,
  error: null
};

const healthGoalSlice = createSlice({
  name: 'healthGoals',
  initialState,
  reducers: {
    fetchGoalsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchGoalsSuccess: (state, action: PayloadAction<HealthGoal[]>) => {
      state.goals = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchGoalsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createGoalStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createGoalSuccess: (state, action: PayloadAction<HealthGoal>) => {
      state.goals.push(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    createGoalFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateGoal: (state, action: PayloadAction<HealthGoal>) => {
      const index = state.goals.findIndex(goal => goal._id === action.payload._id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    deleteGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(goal => goal._id !== action.payload);
    },
    selectGoal: (state, action: PayloadAction<HealthGoal | null>) => {
      state.selectedGoal = action.payload;
    }
  }
});

export const {
  fetchGoalsStart,
  fetchGoalsSuccess,
  fetchGoalsFailure,
  createGoalStart,
  createGoalSuccess,
  createGoalFailure,
  updateGoal,
  deleteGoal,
  selectGoal
} = healthGoalSlice.actions;

export default healthGoalSlice.reducer;
