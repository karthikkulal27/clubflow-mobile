import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      loginApi(phone, password),
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}
