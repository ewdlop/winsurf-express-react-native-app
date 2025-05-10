import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NutritionInsight, NutritionReport } from '../../services/nutritionService';

interface NutritionState {
  insights: NutritionInsight[];
  report: NutritionReport | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NutritionState = {
  insights: [],
  report: null,
  isLoading: false,
  error: null
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    fetchNutritionInsightsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchNutritionInsightsSuccess: (state, action: PayloadAction<NutritionInsight[]>) => {
      state.insights = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchNutritionInsightsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchNutritionReportStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchNutritionReportSuccess: (state, action: PayloadAction<NutritionReport>) => {
      state.report = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchNutritionReportFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchSpecificInsightsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSpecificInsightsSuccess: (state, action: PayloadAction<NutritionInsight[]>) => {
      state.insights = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchSpecificInsightsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    }
  }
});

export const {
  fetchNutritionInsightsStart,
  fetchNutritionInsightsSuccess,
  fetchNutritionInsightsFailure,
  fetchNutritionReportStart,
  fetchNutritionReportSuccess,
  fetchNutritionReportFailure,
  fetchSpecificInsightsStart,
  fetchSpecificInsightsSuccess,
  fetchSpecificInsightsFailure
} = nutritionSlice.actions;

export default nutritionSlice.reducer;
