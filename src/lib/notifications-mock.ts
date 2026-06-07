// Mock for Expo Go — expo-notifications remote push functionality was removed
// from Expo Go in SDK 53+. Merely importing the real module crashes at startup
// ("[runtime not ready]: ... addPushTokenListener"). Use a development build
// ("eas build --profile development") to test real push notifications.

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export function setNotificationHandler(_handler: unknown): void {}

export async function getPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  return { status: 'denied' };
}

export async function requestPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  return { status: 'denied' };
}

export async function setNotificationChannelAsync(_id: string, _channel: unknown): Promise<void> {}

export async function getExpoPushTokenAsync(_options: unknown): Promise<{ data: string }> {
  throw new Error('Expo Go — push notifications require a development build');
}

export const AndroidImportance = { MAX: 5 } as const;
