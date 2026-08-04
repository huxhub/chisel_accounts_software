import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/programs`;

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

export const programService = {
  getPrograms: async () => {
    const res = await fetch(API_URL, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch programs');
    return res.json();
  },

  createProgram: async (name: string, color: string = '#6366f1') => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create program');
    return data;
  },

  deleteProgram: async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete program');
    return data;
  },
};
