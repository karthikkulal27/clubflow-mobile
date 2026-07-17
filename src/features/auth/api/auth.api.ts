import { api } from '../../../lib/api';
import type { ApiResponse, LoginResponse } from '../../../types';

export async function loginApi(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { phone, password });
  return data.data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { oldPassword, newPassword });
}
