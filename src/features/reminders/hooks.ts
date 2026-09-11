'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import type { Reminder, ReminderInput } from './types';

const remindersKey = (userId?: string) => ['reminders', userId] as const;

export function useReminders() {
  const { user } = useAuth();
  return useQuery<Reminder[]>({
    queryKey: remindersKey(user?.sub),
    queryFn: () => apiGet<Reminder[]>(`/api/reminders?userId=${user!.sub}`),
    enabled: !!user?.sub,
  });
}

export function useCreateReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminder: ReminderInput) =>
      apiPost<Reminder>('/api/reminders', { ...reminder, userId: user!.sub }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: remindersKey(user?.sub) }),
  });
}

export function useDeleteReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/api/reminders?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: remindersKey(user?.sub) }),
  });
}
