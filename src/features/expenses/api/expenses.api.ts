import { api } from '../../../lib/api';
import type { ApiResponse, Expense } from '../../../types';

interface ExpenseListResponse {
  expenses: Expense[];
  totalAmount: number;
}

export async function getExpensesApi(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<{ data: ExpenseListResponse; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams({ limit: String(params?.limit ?? 50) });
  if (params?.page) query.set('page', String(params.page));
  if (params?.category) query.set('category', params.category);
  const { data } = await api.get(`/expenses?${query}`);
  return data;
}

export async function createExpenseApi(payload: {
  title: string;
  description?: string;
  amount: number;
  category?: string;
  expenseDate: string;
}): Promise<Expense> {
  const { data } = await api.post<ApiResponse<Expense>>('/expenses', payload);
  return data.data;
}

export async function updateExpenseApi(
  expenseId: string,
  payload: { title: string; amount: number; category?: string; expenseDate: string; description?: string },
): Promise<Expense> {
  const { data } = await api.patch<ApiResponse<Expense>>(`/expenses/${expenseId}`, payload);
  return data.data;
}

export async function deleteExpenseApi(expenseId: string): Promise<void> {
  await api.delete(`/expenses/${expenseId}`);
}
