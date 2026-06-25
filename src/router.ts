import { isAuthenticated, getRole } from './auth.js';

// Redireciona para login se não há token salvo
export function requireAuth(): void {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
  }
}

// Guard de página ADMIN: redireciona médico (CLINICAL) para o painel dele
export function requireAdmin(): void {
  requireAuth();
  if (getRole() !== 'ADMIN') {
    window.location.href = '/medical-dashboard.html';
  }
}

// Guard de página CLINICAL: redireciona engenheiro (ADMIN) para o painel dele
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
