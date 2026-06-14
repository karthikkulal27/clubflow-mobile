import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotificationsApi } from '../features/notifications/api/notifications.api';

export function useNotificationCount() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotificationsApi,
    refetchInterval: 30_000,
  });

  // Refetch immediately when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
    return () => sub.remove();
  }, [qc]);

  return data?.unreadCount ?? 0;
}
