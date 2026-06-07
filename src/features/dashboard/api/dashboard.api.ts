import { api } from '../../../lib/api';
import type { ApiResponse, AdminDashboard, MemberDashboard } from '../../../types';

export async function getDashboardApi(): Promise<AdminDashboard | MemberDashboard> {
  const { data } = await api.get<ApiResponse<AdminDashboard | MemberDashboard>>('/dashboard');
  return data.data;
}
