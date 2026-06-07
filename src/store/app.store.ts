import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';

interface AppState {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
}

export const useAppStore = create<AppState>((set) => ({
  colorScheme: 'light',
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
}));
