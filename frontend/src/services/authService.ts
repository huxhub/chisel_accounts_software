import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/auth`;

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const authService = {
  login: async (userData: any) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to login');
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to register');
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      // Network error — cookie may still be present server-side, but there's
      // nothing more the client can do; still let the UI drop to the login screen.
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  // The auth cookie is httpOnly, so the client can't read it directly —
  // this asks the server who (if anyone) it belongs to.
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
        }
        return null;
      }
      return response.json();
    } catch {
      // Network error (e.g. backend unreachable) — treat as logged out.
      return null;
    }
  }
};
