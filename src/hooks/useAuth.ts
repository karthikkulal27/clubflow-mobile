import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = user?.role ?? null;
  const clubId = user?.clubId ?? null;
  const isAdmin = role === 'ADMIN';

  return { user, isAuthenticated, isLoading, role, clubId, isAdmin };
}
