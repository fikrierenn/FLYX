/** API yardimci - tum isteklerde token gonderir */

import { useAuth } from './auth';

export async function api(path: string, options?: RequestInit) {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options?.headers as any || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}

export async function apiGet(path: string) {
  return api(path).then((r) => r.json());
}

export async function apiPost(path: string, body: any) {
  return api(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
}

export async function apiPut(path: string, body?: any) {
  return api(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());
}

export async function apiDelete(path: string) {
  return api(path, { method: 'DELETE' }).then((r) => r.json());
}
