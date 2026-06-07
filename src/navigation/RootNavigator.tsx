import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { AuthNavigator } from './AuthNavigator';
import { AdminNavigator } from './AdminNavigator';
import { MemberNavigator } from './MemberNavigator';
import type { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isAdmin ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="Member" component={MemberNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
