import { api } from '../../../lib/api';
import type { ApiResponse, Member, Payment, PaginatedResponse } from '../../../types';

export async function addMemberApi(payload: {
  name: string;
  phone: string;
  password: string;
  role?: 'ADMIN' | 'MEMBER';
}): Promise<Member> {
  const { data } = await api.post<ApiResponse<Member>>('/members', payload);
  return data.data;
}

export async function getMembersApi(search = ''): Promise<Member[]> {
  const params = new URLSearchParams({ limit: '50', status: 'active' });
  if (search) params.set('search', search);
  const { data } = await api.get<PaginatedResponse<Member>>(`/members?${params}`);
  return data.data;
}

export async function getMemberApi(userId: string): Promise<Member> {
  const { data } = await api.get<ApiResponse<Member>>(`/members/${userId}`);
  return data.data;
}

export async function updateMemberApi(userId: string, payload: {
  name?: string;
  phone?: string;
  email?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  role?: 'ADMIN' | 'MEMBER';
}): Promise<Member> {
  const { data } = await api.patch<ApiResponse<Member>>(`/members/${userId}`, payload);
  return data.data;
}

export async function deactivateMemberApi(userId: string): Promise<void> {
  await api.patch(`/members/${userId}/deactivate`);
}

export async function reactivateMemberApi(userId: string): Promise<void> {
  await api.patch(`/members/${userId}/reactivate`);
}

export async function deleteMemberApi(userId: string): Promise<void> {
  await api.delete(`/members/${userId}`);
}

export async function updateOwnProfileApi(payload: {
  name?: string;
  phone?: string;
  email?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
}): Promise<Member> {
  const { data } = await api.patch<ApiResponse<Member>>('/members/me', payload);
  return data.data;
}

export async function getMemberPaymentsApi(userId: string): Promise<Payment[]> {
  const { data } = await api.get<ApiResponse<Payment[]>>(`/members/${userId}/payments`);
  return data.data;
}
