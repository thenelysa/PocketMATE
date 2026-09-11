'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import type { CreditCard, CreditCardInput } from './types';

const cardsKey = (userId?: string) => ['cards', userId] as const;

export function useCards() {
  const { user } = useAuth();
  return useQuery<CreditCard[]>({
    queryKey: cardsKey(user?.sub),
    queryFn: () => apiGet<CreditCard[]>(`/api/cards?userId=${user!.sub}`),
    enabled: !!user?.sub,
  });
}

export function useCreateCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (card: CreditCardInput) =>
      apiPost<CreditCard>('/api/cards', { ...card, userId: user!.sub }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardsKey(user?.sub) }),
  });
}

export function useDeleteCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/api/cards?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardsKey(user?.sub) }),
  });
}
