const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const ROLE_KEY = 'user_role';
const USERNAME_KEY = 'username';
export const API_BASE = 'http://localhost:8000/api';
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function getRole() {
    return localStorage.getItem(ROLE_KEY);
}
export function getUsername() {
    return localStorage.getItem(USERNAME_KEY);
}
export function isAuthenticated() {
    return !!getToken();
}
export function saveAuth(token, refresh, role, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(USERNAME_KEY, username);
}
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USERNAME_KEY);
}
export function logout() {
    clearAuth();
    window.location.href = 'index.html';
}
export function authHeaders() {
    const token = getToken();
    return Object.assign({ 'Content-Type': 'application/json' }, (token ? { Authorization: `Bearer ${token}` } : {}));
}
