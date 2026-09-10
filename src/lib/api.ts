// API base URL - in production this would be your deployed server
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// User APIs
export const api = {
  // User
  createUser: (user: { id: string; email: string; name: string; picture?: string }) =>
    apiCall('/api/users', { method: 'POST', body: JSON.stringify(user) }),

  getUser: (id: string) => apiCall(`/api/users/${id}`),

  // Profile
  getProfile: (userId: string) => apiCall(`/api/profiles/${userId}`),

  saveProfile: (profile: { userId: string; displayName?: string; preferredCurrency?: string; reminderDaysBefore?: number; monthlyBudget?: number }) =>
    apiCall('/api/profiles', { method: 'POST', body: JSON.stringify(profile) }),

  // Bills
  getBills: (userId: string) => apiCall(`/api/bills/${userId}`),

  addBill: (bill: any) => apiCall('/api/bills', { method: 'POST', body: JSON.stringify(bill) }),

  updateBill: (id: string, bill: any) => apiCall(`/api/bills/${id}`, { method: 'PUT', body: JSON.stringify(bill) }),

  deleteBill: (id: string) => apiCall(`/api/bills/${id}`, { method: 'DELETE' }),

  // Bill Payments
  getBillPayments: (billId: string) => apiCall(`/api/bill-payments/${billId}`),

  addBillPayment: (payment: any) => apiCall('/api/bill-payments', { method: 'POST', body: JSON.stringify(payment) }),

  // Cards
  getCards: (userId: string) => apiCall(`/api/cards/${userId}`),

  addCard: (card: any) => apiCall('/api/cards', { method: 'POST', body: JSON.stringify(card) }),

  deleteCard: (id: string) => apiCall(`/api/cards/${id}`, { method: 'DELETE' }),

  // Card Transactions
  addCardTransaction: (tx: any) => apiCall('/api/card-transactions', { method: 'POST', body: JSON.stringify(tx) }),

  // Card Payments
  addCardPayment: (payment: any) => apiCall('/api/card-payments', { method: 'POST', body: JSON.stringify(payment) }),

  // Reminders
  getReminders: (userId: string) => apiCall(`/api/reminders/${userId}`),

  addReminder: (reminder: any) => apiCall('/api/reminders', { method: 'POST', body: JSON.stringify(reminder) }),

  deleteReminder: (id: string) => apiCall(`/api/reminders/${id}`, { method: 'DELETE' }),
};
