import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import RazorpayCheckout from '../../../lib/razorpay-mock';
import {
  getMyPaymentsApi,
  getPaymentsListApi,
  getPaymentStatsApi,
  createOrderApi,
  verifyPaymentApi,
  markPaymentPaidApi,
} from '../api/payments.api';
import { getDuesPlansApi, createDuesPlanApi, deleteDuesPlanApi } from '../api/dues-plans.api';
import {
  getSpecialCollectionsApi,
  getSpecialCollectionPaymentsApi,
  createSpecialCollectionApi,
} from '../api/special-collections.api';
import { useAuth } from '../../../hooks/useAuth';
import type { DuesPlanPeriod } from '../../../types';

const now = new Date();

export function useMyPayments() {
  return useQuery({
    queryKey: ['payments', 'my'],
    queryFn: getMyPaymentsApi,
  });
}

export function usePaymentsList(month = now.getMonth() + 1, year = now.getFullYear()) {
  return useQuery({
    queryKey: ['payments', 'list', month, year],
    queryFn: () => getPaymentsListApi({ month, year, limit: 100 }),
  });
}

export function usePaymentStats(month = now.getMonth() + 1, year = now.getFullYear()) {
  return useQuery({
    queryKey: ['payments', 'stats', month, year],
    queryFn: () => getPaymentStatsApi(month, year),
    staleTime: 30 * 1000,
  });
}

export function usePayNow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const order = await createOrderApi(paymentId);

      const options = {
        description: `${order.clubName} — subscription`,
        currency: order.currency,
        key: order.keyId,
        amount: String(order.amount),
        name: order.clubName,
        order_id: order.orderId,
        prefill: {
          contact: user?.phone ?? '',
          name: user?.name ?? '',
        },
        theme: { color: '#2563eb' },
      };

      // Opens Razorpay native checkout
      const razorpayData = await RazorpayCheckout.open(options);

      // Verify on backend
      const verified = await verifyPaymentApi({
        paymentId,
        razorpayOrderId: razorpayData.razorpay_order_id,
        razorpayPaymentId: razorpayData.razorpay_payment_id,
        razorpaySignature: razorpayData.razorpay_signature,
      });

      return verified;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Payment Successful', 'Your payment has been recorded. Thank you!');
    },
    onError: (err: unknown) => {
      const msg = (err as { description?: string })?.description;
      // Razorpay cancellation has no description — don't show error
      if (msg) Alert.alert('Payment Failed', msg);
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => markPaymentPaidApi(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['special-collections'] });
    },
  });
}

export function useSpecialCollections() {
  return useQuery({
    queryKey: ['special-collections'],
    queryFn: getSpecialCollectionsApi,
  });
}

export function useSpecialCollectionPayments(collectionId: string) {
  return useQuery({
    queryKey: ['special-collections', collectionId, 'payments'],
    queryFn: () => getSpecialCollectionPaymentsApi(collectionId),
    enabled: !!collectionId,
  });
}

export function useCreateSpecialCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { label: string; amount: number; month: number; year: number; dueDate: string }) =>
      createSpecialCollectionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-collections'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useDuesPlans() {
  return useQuery({
    queryKey: ['dues-plans'],
    queryFn: getDuesPlansApi,
  });
}

export function useCreateDuesPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { label?: string; amount: number; periods: DuesPlanPeriod[] }) =>
      createDuesPlanApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dues-plans'] });
    },
  });
}

export function useDeleteDuesPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => deleteDuesPlanApi(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dues-plans'] });
    },
  });
}
