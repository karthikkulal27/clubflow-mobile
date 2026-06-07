import { api } from '../../../lib/api';
import type { ApiResponse, Club } from '../../../types';

export async function getClubApi(): Promise<Club> {
  const { data } = await api.get<ApiResponse<Club>>('/club');
  return data.data;
}

export async function updateClubApi(payload: {
  name?: string;
  description?: string;
}): Promise<Club> {
  const { data } = await api.patch<ApiResponse<Club>>('/club', payload);
  return data.data;
}
