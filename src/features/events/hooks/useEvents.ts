import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventsApi, getEventDetailApi, rsvpEventApi } from '../api/events.api';
import type { RsvpStatus } from '../../../types';

export function useEvents(upcoming?: boolean) {
  return useQuery({
    queryKey: ['events', upcoming],
    queryFn: () => getEventsApi(upcoming),
  });
}

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEventDetailApi(eventId),
    enabled: !!eventId,
  });
}

export function useRsvp(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: RsvpStatus) => rsvpEventApi(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
