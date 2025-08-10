export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const body = isJson ? await res.json() : null;
    if (!res.ok) {
      const msg = body?.error || res.statusText || 'Request failed';
      return { ok: false, error: msg };
    }
    return { ok: true, data: body as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function signup(email: string, password: string) {
  return request<{ message: string; user: { id: number; email: string } }>(`/signup`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return request<{ message: string; user: { id: number; email: string } }>(`/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function beginGoogleOAuth() {
  // Full-page redirect to backend OAuth begin route
  window.location.href = `${API_URL}/auth/google`;
}

export async function me() {
  return request<{ user: { id: number; email: string; name?: string; avatar?: string } }>(`/me`);
}


