'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import type { HouseholdView, PlanInput, StatementRow, StudioPlan } from './types';
export function useStudio() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['studio', user?.sub], queryFn: () => apiGet<StudioPlan>('/api/studio'), enabled: !!user });
}
export function useSavePlan() {
  const client = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: (input: PlanInput | { transactions: StatementRow[]; version: number }) => apiPut<StudioPlan>('/api/studio', input), onSuccess: data => client.setQueryData(['studio', user?.sub], data), onError: () => { void client.invalidateQueries({ queryKey: ['studio'] }); } });
}
export function useHouseholds() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['households', user?.sub], queryFn: () => apiGet<HouseholdView[]>('/api/households'), enabled: !!user, refetchInterval: 15000 });
}
export function useHouseholdAction() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: Record<string, unknown>) => apiPost<{ inviteCode?: string }>('/api/households', input), onSuccess: () => client.invalidateQueries({ queryKey: ['households'] }) });
}
