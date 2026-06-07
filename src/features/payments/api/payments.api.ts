import { api } from '../../../lib/api';
import type {
  ApiResponse,
  PaginatedResponse,
  Payment,
  PaymentStats,
  RazorpayOrder,
} from '../../../types';

export async function getMyPaymentsApi(): Promise<Payment[]> {
  const { data } = await api.get<ApiResponse<Payment[]>>('/payments/my');
  return data.data;
}

export async function getPaymentsListApi(params: {
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Payment>> {
  const query = new URLSearchParams();
  if (params.month) query.set('month', String(params.month));
  if (params.year) query.set('year', String(params.year));
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const { data } = await api.get<PaginatedResponse<Payment>>(`/payments?${query}`);
  return data;
}

export async function getPaymentStatsApi(month: number, year: number): Promise<PaymentStats> {
  const { data } = await api.get<ApiResponse<PaymentStats>>(
    `/payments/stats?month=${month}&year=${year}`,
  );
  return data.data;
}

export async function createOrderApi(paymentId: string): Promise<RazorpayOrder> {
  const { data } = await api.post<ApiResponse<RazorpayOrder>>('/payments/create-order', {
    paymentId,
  });
  return data.data;
}

export async function verifyPaymentApi(payload: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Payment> {
  const { data } = await api.post<ApiResponse<Payment>>('/payments/verify', payload);
  return data.data;
}

export async function markPaymentPaidApi(paymentId: string): Promise<Payment> {
  const { data } = await api.patch<ApiResponse<Payment>>(`/payments/${paymentId}/mark-paid`);
  return data.data;
}
