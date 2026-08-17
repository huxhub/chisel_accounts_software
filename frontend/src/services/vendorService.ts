import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/vendors`;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const vendorService = {
  getVendors: async () => {
    const res = await fetch(API_URL, { headers: getHeaders(), credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  },

  createVendor: async (name: string) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create vendor');
    return data;
  },

  deleteVendor: async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete vendor');
    return data;
  },

  addEntry: async (vendorId: number, entry: {
    type: 'purchase' | 'sale';
    itemName: string;
    amount: number;
    party: string;
    date: string;
    note?: string;
  }) => {
    const res = await fetch(`${API_URL}/${vendorId}/entries`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add entry');
    return data;
  },

  deleteEntry: async (vendorId: number, entryId: number) => {
    const res = await fetch(`${API_URL}/${vendorId}/entries/${entryId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete entry');
    return data;
  },
};
