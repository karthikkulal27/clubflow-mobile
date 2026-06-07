import { api } from '../../../lib/api';
import type { ApiResponse, Payment, SpecialCollection } from '../../../types';

export async function getSpecialCollectionsApi(): Promise<SpecialCollection[]> {
  const { data } = await api.get<ApiResponse<SpecialCollection[]>>('/special-collections');
  return data.data;
}

export async function getSpecialCollectionPaymentsApi(collectionId: string): Promise<{
  collection: Pick<SpecialCollection, 'id' | 'label' | 'amount' | 'currency' | 'month' | 'year' | 'dueDate' | 'createdAt'>;
  payments: Payment[];
}> {
  const { data } = await api.get<ApiResponse<{
    collection: SpecialCollection;
    payments: Payment[];
  }>>(`/special-collections/${collectionId}/payments`);
  return data.data;
}

export async function createSpecialCollectionApi(payload: {
  label: string;
  amount: number;
  month: number;
  year: number;
  dueDate: string;
}): Promise<SpecialCollection> {
  const { data } = await api.post<ApiResponse<SpecialCollection>>('/special-collections', payload);
  return data.data;
}
