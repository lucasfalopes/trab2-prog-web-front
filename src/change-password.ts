import { requireAuth } from './router.js';
import { getRole, logout, authHeaders, API_BASE } from './auth.js';
import { showToast } from './toast.js';

requireAuth();

const form         = document.getElementById('change-password-form') as HTMLFormElement;
const submitBtn    = document.getElementById('submit-btn') as HTMLButtonElement;
const backLink     = document.getElementById('back-link') as HTMLAnchorElement;
const oldInput     = document.getElementById('old_password') as HTMLInputElement;
const newInput     = document.getElementById('new_password') as HTMLInputElement;
const confirmInput = document.getElementById('confirm_password') as HTMLInputElement;

backLink.href = getRole() === 'ADMIN' ? 'admin-dashboard.html' : 'medical-dashboard.html';

form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const oldPassword     = oldInput.value.trim();
    const newPassword     = newInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('Preencha todos os campos.', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showToast('A nova senha deve ter pelo menos 8 caracteres.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('A confirmação de senha não confere.', 'error');
        return;
    }

    if (newPassword === oldPassword) {
        showToast('A nova senha não pode ser igual à senha atual.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    try {
        const response = await fetch(`${API_BASE}/users/change-password/`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });

        if (response.status === 401) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            setTimeout(logout, 1500);
            return;
        }

        if (response.status === 400) {
            const data = await response.json();
            const msg = data?.old_password?.[0] ?? data?.new_password?.[0] ?? data?.detail ?? 'Dados inválidos.';
            showToast(msg, 'error');
            return;
        }

        if (!response.ok) {
            showToast('Erro ao trocar a senha. Tente novamente.', 'error');
            return;
        }

        showToast('Senha alterada com sucesso!', 'success');
        form.reset();
        setTimeout(() => { window.location.href = backLink.href; }, 1500);

    } catch {
        showToast('Falha de conexão com o servidor.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar nova senha';
    }
});
