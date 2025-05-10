import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../types/NavigationTypes';
import DashboardScreen from '../screens/DashboardScreen';
import NutritionScreen from '../screens/NutritionScreen';
import HealthScreen from '../screens/HealthScreen';
import SocialScreen from '../screens/SocialScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabNavigatorParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Nutrition" 
        component={NutritionScreen} 
        options={{ title: 'Nutrition' }}
      />
      <Tab.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{ title: 'Health' }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen} 
        options={{ title: 'Community' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
