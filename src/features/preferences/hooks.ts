'use client';
import { useSyncExternalStore } from 'react';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('preferences-changed', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('preferences-changed', callback); };
}
export function useCurrency() {
  return useSyncExternalStore(subscribe, () => localStorage.getItem('settings_currency') === 'NPR' ? 'NPR' : 'USD', () => 'USD');
}
