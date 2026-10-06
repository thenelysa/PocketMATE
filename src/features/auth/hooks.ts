'use client';
import { apiGet, apiPost } from '@/lib/api-client';
export interface SessionUser { sub: string; email: string; name: string; picture: string }
export const signInWithGoogle = (accessToken: string) => apiPost<SessionUser>('/api/auth', { accessToken });
export const getSession = () => apiGet<SessionUser>('/api/auth');
export const signOut = () => apiPost('/api/auth/logout', {});
