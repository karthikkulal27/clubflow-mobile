import { api } from '../../../lib/api';
import type { ApiResponse, DuesPlan, DuesPlanPeriod } from '../../../types';

export async function getDuesPlansApi(): Promise<DuesPlan[]> {
  const { data } = await api.get<ApiResponse<DuesPlan[]>>('/dues-plans');
  return data.data;
}

export async function createDuesPlanApi(payload: {
  label?: string;
  amount: number;
  periods: DuesPlanPeriod[];
}): Promise<DuesPlan> {
  const { data } = await api.post<ApiResponse<DuesPlan>>('/dues-plans', payload);
  return data.data;
}

export async function deleteDuesPlanApi(planId: string): Promise<void> {
  await api.delete(`/dues-plans/${planId}`);
}
