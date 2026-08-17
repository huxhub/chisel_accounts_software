import { API_BASE_URL } from './config';
import type { Ledger, Voucher, LedgerStatement } from '../app/types';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export const ledgerService = {
  getLedgers: async (type?: 'vendor' | 'customer'): Promise<Ledger[]> => {
    const query = type ? `?type=${type}` : '';
    return request<Ledger[]>(`${API_BASE_URL}/api/ledgers${query}`);
  },

  createLedger: async (data: {
    name: string;
    type: 'vendor' | 'customer';
    openingBalance?: number;
    openingType?: 'debit' | 'credit';
  }): Promise<Ledger> => {
    return request<Ledger>(`${API_BASE_URL}/api/ledgers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLedger: async (id: number): Promise<void> => {
    return request(`${API_BASE_URL}/api/ledgers/${id}`, {
      method: 'DELETE',
    });
  },

  getStatement: async (id: number): Promise<LedgerStatement> => {
    return request<LedgerStatement>(`${API_BASE_URL}/api/ledgers/${id}/statement`);
  },

  createVoucher: async (data: {
    type: 'purchase' | 'sale' | 'payment' | 'receipt';
    ledgerId: number;
    accountId?: string | number | null;
    date: string;
    itemName?: string;
    amount: number;
    note?: string;
    programId?: number | null;
    document?: any;
    paidNow?: number;
  }): Promise<Voucher> => {
    const res = await request<any>(`${API_BASE_URL}/api/vouchers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.voucher || res;
  },

  deleteVoucher: async (id: number): Promise<void> => {
    return request(`${API_BASE_URL}/api/vouchers/${id}`, {
      method: 'DELETE',
    });
  },

  getProfitReport: async (from?: string, to?: string, programId?: number) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (programId) params.append('programId', String(programId));
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`${API_BASE_URL}/api/vouchers/profit${query}`);
  },
};
