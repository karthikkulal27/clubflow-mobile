import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { queryClient } from './src/lib/query-client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function AppContent() {
  usePushNotifications();
  const scheme = useColorScheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      <Toast topOffset={60} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
