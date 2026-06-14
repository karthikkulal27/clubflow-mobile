import { useEffect } from 'react';
import * as Notifications from '../lib/notifications-bridge';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();
  }, [isAuthenticated]);
}

async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    Toast.show({ type: 'info', text1: 'Push setup', text2: `projectId: ${projectId ?? 'missing'} | appOwnership: ${Constants.appOwnership}` });

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    Toast.show({ type: 'success', text1: 'Token fetched', text2: tokenData.data.slice(0, 40) });

    await api.post('/auth/push-token', {
      token: tokenData.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    Toast.show({ type: 'success', text1: 'Push token saved' });
  } catch (err: any) {
    Toast.show({ type: 'error', text1: 'Push token failed', text2: err?.message ?? String(err) });
  }
}
