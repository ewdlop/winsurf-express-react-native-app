import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './reducers/authReducer';
import healthGoalReducer from './reducers/healthGoalReducer';
import mealPlanReducer from './reducers/mealPlanReducer';
import nutritionReducer from './reducers/nutritionReducer';
import socialReducer from './reducers/socialReducer';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth'] // Only persist auth reducer
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  healthGoals: healthGoalReducer,
  mealPlans: mealPlanReducer,
  nutrition: nutritionReducer,
  social: socialReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

// Create persistor
export const persistor = persistStore(store);

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
