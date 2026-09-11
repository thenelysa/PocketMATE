'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

// ============ BILLS ============

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  provider: string | null;
  amount: number;
  due_date: string;
  category: string | null;
  recurrence: string | null;
  status: string;
  is_business: boolean;
  paid_amount: number;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBills() {
  const { user } = useAuth();
  return useQuery<Bill[]>({
    queryKey: ['bills', user?.sub],
    queryFn: async () => {
      if (!user?.sub) return [];
      const res = await fetch(`/api/bills?userId=${user.sub}`);
      if (!res.ok) throw new Error('Failed to fetch bills');
      return res.json();
    },
    enabled: !!user?.sub,
  });
}

export function useCreateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Omit<Bill, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.sub) throw new Error('Not authenticated');
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bill, userId: user.sub }),
      });
      if (!res.ok) throw new Error('Failed to create bill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.sub] });
    },
  });
}

export function useUpdateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...bill }: Partial<Bill> & { id: string }) => {
      const res = await fetch(`/api/bills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...bill }),
      });
      if (!res.ok) throw new Error('Failed to update bill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.sub] });
    },
  });
}

export function useDeleteBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bills?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete bill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.sub] });
    },
  });
}

// ============ REMINDERS ============

export interface Reminder {
  id: string;
  user_id: string;
  bill_id: string | null;
  remind_date: string;
  remind_time: string | null;
  message: string | null;
  is_sent: boolean;
  created_at: string;
}

export function useReminders() {
  const { user } = useAuth();
  return useQuery<Reminder[]>({
    queryKey: ['reminders', user?.sub],
    queryFn: async () => {
      if (!user?.sub) return [];
      const res = await fetch(`/api/reminders?userId=${user.sub}`);
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    },
    enabled: !!user?.sub,
  });
}

export function useCreateReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.sub) throw new Error('Not authenticated');
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reminder, userId: user.sub }),
      });
      if (!res.ok) throw new Error('Failed to create reminder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.sub] });
    },
  });
}

export function useDeleteReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete reminder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.sub] });
    },
  });
}

// ============ CARDS ============

export interface CreditCard {
  id: string;
  user_id: string;
  bank_name: string;
  card_name: string | null;
  last_four_digits: string | null;
  credit_limit: number;
  current_outstanding: number;
  statement_date: number;
  payment_due_date: number;
  minimum_payment: number;
  annual_interest_rate: number;
  card_status: string;
  created_at: string;
  updated_at: string;
}

export function useCards() {
  const { user } = useAuth();
  return useQuery<CreditCard[]>({
    queryKey: ['cards', user?.sub],
    queryFn: async () => {
      if (!user?.sub) return [];
      const res = await fetch(`/api/cards?userId=${user.sub}`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      return res.json();
    },
    enabled: !!user?.sub,
  });
}

export function useCreateCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.sub) throw new Error('Not authenticated');
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...card, userId: user.sub }),
      });
      if (!res.ok) throw new Error('Failed to create card');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', user?.sub] });
    },
  });
}

export function useDeleteCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cards?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete card');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', user?.sub] });
    },
  });
}
