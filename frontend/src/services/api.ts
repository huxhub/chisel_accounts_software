import { authService } from './authService';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/accounts`;

const JSON_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: JSON_HEADERS,
      ...options,
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      authService.logout();
      // Removed window.location.reload() to prevent infinite loops
    }
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // response body wasn't JSON — fall back to the generic status-based message
    }
    throw new Error(message);
  }

  return response.json();
}

export const accountService = {
  getAccounts: () => request(''),

  createAccount: (accountData: any) =>
    request('', { method: 'POST', body: JSON.stringify(accountData) }),

  updateAccountName: (id: string, name: string) =>
    request(`/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),

  deleteAccount: (id: string, password: string) =>
    request(`/${id}`, { method: 'DELETE', body: JSON.stringify({ password }) }),

  seedAccounts: () => request('/seed', { method: 'POST' }),

  updateOpeningBalance: (id: string, openingBalance: number) =>
    request(`/${id}/balance`, { method: 'PUT', body: JSON.stringify({ openingBalance }) }),

  addTransaction: (accountId: string, transaction: any) =>
    request(`/${accountId}/transactions`, { method: 'POST', body: JSON.stringify(transaction) }),

  deleteTransaction: (accountId: string, txId: string) =>
    request(`/${accountId}/transactions/${txId}`, { method: 'DELETE' }),

  updateTransaction: (accountId: string, txId: string, transaction: any) =>
    request(`/${accountId}/transactions/${txId}`, { method: 'PUT', body: JSON.stringify(transaction) }),
};
