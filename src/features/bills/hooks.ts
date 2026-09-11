'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import type { Bill, BillInput } from './types';

/** Query key for every bills cache entry. Mutations must invalidate this exact key. */
const billsKey = (userId?: string) => ['bills', userId] as const;

export function useBills() {
  const { user } = useAuth();
  return useQuery<Bill[]>({
    queryKey: billsKey(user?.sub),
    queryFn: () => apiGet<Bill[]>(`/api/bills?userId=${user!.sub}`),
    enabled: !!user?.sub,
  });
}

export function useCreateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bill: BillInput) => apiPost<Bill>('/api/bills', { ...bill, userId: user!.sub }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsKey(user?.sub) }),
  });
}

export function useUpdateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bill: Partial<BillInput> & { id: string }) => apiPut<Bill>('/api/bills', bill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsKey(user?.sub) }),
  });
}

export function useDeleteBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/api/bills?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsKey(user?.sub) }),
  });
}
