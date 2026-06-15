import { isAuthenticated, getRole } from './auth.js';

if (!isAuthenticated()) {
  window.location.href = '/login.html';
} else if (getRole() === 'ADMIN') {
  window.location.href = '/admin-dashboard.html';
} else {
  window.location.href = '/medical-dashboard.html';
}
