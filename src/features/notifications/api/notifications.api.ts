import { api } from '../../../lib/api';
import type { AppNotification } from '../../../types';

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export async function getNotificationsApi(): Promise<NotificationsResponse> {
  const { data } = await api.get('/notifications?limit=50');
  return data.data;
}

export async function markAllReadApi(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function markReadApi(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}
