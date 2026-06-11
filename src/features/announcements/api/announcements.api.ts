import { api } from '../../../lib/api';
import type { ApiResponse, PaginatedResponse, Announcement } from '../../../types';

export async function getAnnouncementsApi(): Promise<PaginatedResponse<Announcement>> {
  const { data } = await api.get<PaginatedResponse<Announcement>>('/announcements?limit=50');
  return data;
}

export async function createAnnouncementApi(payload: {
  title: string;
  body: string;
}): Promise<Announcement> {
  const { data } = await api.post<ApiResponse<Announcement>>('/announcements', payload);
  return data.data;
}

export async function publishAnnouncementApi(announcementId: string): Promise<void> {
  await api.post(`/announcements/${announcementId}/publish`);
}

export async function deleteAnnouncementApi(announcementId: string): Promise<void> {
  await api.delete(`/announcements/${announcementId}`);
}
