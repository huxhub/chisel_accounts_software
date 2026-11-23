/// <reference types="vite/client" />

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export { API_BASE_URL };
