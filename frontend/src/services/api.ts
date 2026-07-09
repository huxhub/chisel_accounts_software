import { authService } from './authService';

const API_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/accounts'
  : 'https://brandswamy.onrender.com/api/accounts';

const getAuthHeaders = (): Record<string, string> => {
  const user = authService.getCurrentUser();
  if (user && user.token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
    };
  }
  return { 'Content-Type': 'application/json' };
};

export const accountService = {
  getAccounts: async () => {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        // Removed window.location.reload() to prevent infinite loops
      }
      throw new Error('Failed to fetch accounts');
    }
    return response.json();
  },

  createAccount: async (accountData: any) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });
    if (!response.ok) throw new Error('Failed to create account');
    return response.json();
  },

  updateAccountName: async (id: string, name: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  },

  deleteAccount: async (id: string, password: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete account');
    }
    return response.json();
  },

  seedAccounts: async () => {
    const response = await fetch(`${API_URL}/seed`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to seed accounts');
    return response.json();
  },

  updateOpeningBalance: async (id: string, openingBalance: number) => {
    const response = await fetch(`${API_URL}/${id}/balance`, {
      method: 'put',
      headers: getAuthHeaders(),
      body: JSON.stringify({ openingBalance }),
    });
    if (!response.ok) throw new Error('Failed to update balance');
    return response.json();
  },

  addTransaction: async (accountId: string, transaction: any) => {
    const response = await fetch(`${API_URL}/${accountId}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to add transaction');
    return response.json();
  },

  deleteTransaction: async (accountId: string, txId: string) => {
    const response = await fetch(`${API_URL}/${accountId}/transactions/${txId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
    return response.json();
  }
};
