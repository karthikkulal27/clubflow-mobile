import { api } from '../../../lib/api';
import type { ApiResponse } from '../../../types';

export interface IncomeEntry {
  id: string;
  clubId: string;
  category: string;
  amount: number;
  description?: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
  };
}

interface IncomeListResponse {
  income: IncomeEntry[];
  totalAmount: number;
}

export async function getIncomeApi(): Promise<IncomeEntry[]> {
  const { data } = await api.get<ApiResponse<IncomeEntry[]>>('/income');
  return data.data;
}

export async function createIncomeApi(payload: {
  category: string;
  amount: number;
  description?: string;
}): Promise<IncomeEntry> {
  const { data } = await api.post<ApiResponse<IncomeEntry>>('/income', payload);
  return data.data;
}

export async function deleteIncomeApi(incomeId: string): Promise<void> {
  await api.delete(`/income/${incomeId}`);
}
