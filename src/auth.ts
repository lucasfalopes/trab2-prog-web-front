const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const ROLE_KEY = 'user_role';
const USERNAME_KEY = 'username';

export const API_BASE = 'http://localhost:8000/api';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function saveAuth(token: string, refresh: string, role: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function logout(): void {
  clearAuth();
  window.location.href = 'index.html';
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
