import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMemberApi,
  updateMemberApi,
  updateOwnProfileApi,
  deactivateMemberApi,
  reactivateMemberApi,
  deleteMemberApi,
  getMemberPaymentsApi,
} from '../api/members.api';

export function useMember(userId: string) {
  return useQuery({
    queryKey: ['members', userId],
    queryFn: () => getMemberApi(userId),
    enabled: !!userId,
  });
}

export function useUpdateMember(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateMemberApi>[1]) =>
      updateMemberApi(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDeactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateMemberApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useReactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateMemberApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMemberApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateOwnProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnProfileApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useMemberPayments(userId: string) {
  return useQuery({
    queryKey: ['members', userId, 'payments'],
    queryFn: () => getMemberPaymentsApi(userId),
    enabled: !!userId,
  });
}
