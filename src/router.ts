import { isAuthenticated, getRole } from './auth.js';

export function requireAuth(): void {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
  }
}

export function requireAdmin(): void {
  requireAuth();
  if (getRole() !== 'ADMIN') {
    window.location.href = '/medical-dashboard.html';
  }
}

export function requireClinical(): void {
  requireAuth();
  if (getRole() !== 'CLINICAL') {
    window.location.href = '/admin-dashboard.html';
  }
}

export function redirectByRole(): void {
  const role = getRole();
  if (role === 'ADMIN') {
    window.location.href = '/admin-dashboard.html';
  } else {
    window.location.href = '/medical-dashboard.html';
  }
}
