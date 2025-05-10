import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MealPlan } from '../../services/mealPlanService';

interface MealPlanState {
  mealPlans: MealPlan[];
  selectedMealPlan: MealPlan | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: MealPlanState = {
  mealPlans: [],
  selectedMealPlan: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1
};

const mealPlanSlice = createSlice({
  name: 'mealPlans',
  initialState,
  reducers: {
    fetchMealPlansStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMealPlansSuccess: (state, action: PayloadAction<{
      mealPlans: MealPlan[], 
      totalPages: number, 
      currentPage: number
    }>) => {
      state.mealPlans = action.payload.mealPlans;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.isLoading = false;
      state.error = null;
    },
    fetchMealPlansFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    generateMealPlanStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    generateMealPlanSuccess: (state, action: PayloadAction<MealPlan>) => {
      state.mealPlans.push(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    generateMealPlanFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectMealPlan: (state, action: PayloadAction<MealPlan | null>) => {
      state.selectedMealPlan = action.payload;
    },
    deleteMealPlan: (state, action: PayloadAction<string>) => {
      state.mealPlans = state.mealPlans.filter(plan => plan._id !== action.payload);
    }
  }
});

export const {
  fetchMealPlansStart,
  fetchMealPlansSuccess,
  fetchMealPlansFailure,
  generateMealPlanStart,
  generateMealPlanSuccess,
  generateMealPlanFailure,
  selectMealPlan,
  deleteMealPlan
} = mealPlanSlice.actions;

export default mealPlanSlice.reducer;
