import { isAuthenticated, getRole } from './auth.js';

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
  }
}

export function requireAdmin() {
  requireAuth();
  if (getRole() !== 'ADMIN') {
    window.location.href = '/medical-dashboard.html';
  }
}

export function requireClinical() {
  requireAuth();
  if (getRole() !== 'CLINICAL') {
    window.location.href = '/admin-dashboard.html';
  }
}

export function redirectByRole() {
  const role = getRole();
  if (role === 'ADMIN') {
    window.location.href = '/admin-dashboard.html';
  } else {
    window.location.href = '/medical-dashboard.html';
  }
}
