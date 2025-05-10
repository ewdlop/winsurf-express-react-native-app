/**
 * NutriScan Mobile App
 * Main Application Entry Point
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from 'src/store/store';
import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingIndicator from './src/components/common/LoadingIndicator';

const App: React.FC = () => (
  <Provider store={store}>
    <PersistGate loading={<LoadingIndicator />} persistor={persistor}>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar barStyle="default" />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </PersistGate>
  </Provider>
);

export default App;