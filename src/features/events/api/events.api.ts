import { api } from '../../../lib/api';
import type { ApiResponse, PaginatedResponse, Event, RsvpStatus } from '../../../types';

export async function getEventsApi(upcoming?: boolean): Promise<PaginatedResponse<Event>> {
  const query = new URLSearchParams({ limit: '50' });
  if (upcoming) query.set('upcoming', 'true');
  const { data } = await api.get<PaginatedResponse<Event>>(`/events?${query}`);
  return data;
}

export async function getEventDetailApi(eventId: string): Promise<Event> {
  const { data } = await api.get<ApiResponse<Event>>(`/events/${eventId}`);
  return data.data;
}

export async function rsvpEventApi(
  eventId: string,
  status: RsvpStatus,
): Promise<{ id: string; status: RsvpStatus }> {
  const { data } = await api.post<ApiResponse<{ id: string; status: RsvpStatus }>>(
    `/events/${eventId}/rsvp`,
    { status },
  );
  return data.data;
}

export async function createEventApi(payload: {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
}): Promise<Event> {
  const { data } = await api.post<ApiResponse<Event>>('/events', payload);
  return data.data;
}

export async function updateEventApi(
  eventId: string,
  payload: {
    title?: string;
    description?: string;
    location?: string;
    startAt?: string;
    endAt?: string;
  },
): Promise<Event> {
  const { data } = await api.patch<ApiResponse<Event>>(`/events/${eventId}`, payload);
  return data.data;
}

export async function deleteEventApi(eventId: string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}
