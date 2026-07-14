import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ClubBranding } from "../features/club/api/club.api";

interface ClubBrandingState {
  branding: ClubBranding | null;
  setBranding: (branding: ClubBranding) => void;
  clearBranding: () => void;
  loadBranding: () => Promise<void>;
}

export const useClubBrandingStore = create<ClubBrandingState>((set) => {
  return {
    branding: null,
    setBranding: (branding) => {
      console.log('[ClubBrandingStore] Setting branding:', branding);
      set({ branding });
      // Persist to AsyncStorage in background
      AsyncStorage.setItem('clubBranding', JSON.stringify(branding)).then(
        () => console.log('[ClubBrandingStore] Branding persisted'),
        (err) => console.error('[ClubBrandingStore] Failed to persist:', err)
      );
    },
    clearBranding: () => {
      console.log('[ClubBrandingStore] Clearing branding');
      set({ branding: null });
      AsyncStorage.removeItem('clubBranding').then(
        () => console.log('[ClubBrandingStore] Branding cleared'),
        (err) => console.error('[ClubBrandingStore] Failed to clear:', err)
      );
    },
    loadBranding: async () => {
      try {
        const stored = await AsyncStorage.getItem('clubBranding');
        if (stored) {
          const branding = JSON.parse(stored) as ClubBranding;
          console.log('[ClubBrandingStore] Loaded branding from storage:', branding);
          set({ branding });
        }
      } catch (err) {
        console.error('[ClubBrandingStore] Failed to load branding:', err);
      }
    },
  };
});
