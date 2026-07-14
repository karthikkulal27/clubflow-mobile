import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import { useClubBrandingStore } from '../../../store/club-branding.store';
import { getClubBrandingApi } from '../../club/api/club.api';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBranding = useClubBrandingStore((s) => s.setBranding);

  return useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      loginApi(phone, password),
    onSuccess: async (data) => {
      console.log('[useLogin] Login successful, setting auth');
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });

      // Fetch club branding after login
      try {
        console.log('[useLogin] Fetching club branding...');
        const branding = await getClubBrandingApi();
        console.log('[useLogin] Branding fetched:', branding);
        setBranding(branding);
        console.log('[useLogin] Branding stored in store');
      } catch (err) {
        console.error('[useLogin] Failed to fetch club branding:', err);
      }
    },
    onError: (error) => {
      console.error('[useLogin] Login failed:', error);
    },
  });
}
