import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@clubflow:access_token',
  REFRESH_TOKEN: '@clubflow:refresh_token',
  AUTH_USER: '@clubflow:auth_user',
  THEME: '@clubflow:theme',
} as const;

export const storage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },
  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async getAuthUser(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.AUTH_USER);
  },
  async setAuthUser(user: object): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
  },

  async getTheme(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.THEME);
  },
  async setTheme(theme: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(KEYS.AUTH_USER),
    ]);
  },
};
