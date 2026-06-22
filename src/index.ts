import { requireAdmin, requireClinical } from './router.js';
import { showToast } from './toast.js';

const loginForm = document.getElementById("login-form") as HTMLFormElement;

if (loginForm) {
    loginForm.addEventListener("submit", async (e: Event) => {
        e.preventDefault();

        const usernameInput = document.getElementById("username") as HTMLInputElement;
        const passwordInput = document.getElementById("password") as HTMLInputElement;

        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch("http://localhost:8000/api/token/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Salvar dados no localStorage
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user_role", data.role);
                localStorage.setItem("username", data.username);
                
                // Redirecionar usuário dependendo da flag must_change_password
                if (data.must_change_password) {
                    window.location.href = "force-change-password.html";
                } else if (data.role === "ADMIN") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "medical-dashboard.html";
                }
                
            } else {
                const errorData = await response.json();
                showToast("Erro ao fazer login: " + (errorData.detail || "Credenciais inválidas."), 'error');
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            showToast("Erro de conexão com o servidor.", 'error');
        }
    });
}

// ==========================================
// FORGOT PASSWORD LOGIC
// ==========================================
const forgotPasswordForm = document.getElementById("forgot-password-form") as HTMLFormElement;
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const emailInput = document.getElementById("email") as HTMLInputElement;
        try {
            const response = await fetch("http://localhost:8000/api/users/reset-request/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value })
            });
            if (response.ok) {
                showToast("Sua solicitação foi enviada aos administradores.", 'success');
                setTimeout(() => { window.location.href = "index.html"; }, 1500);
            } else {
                showToast("Erro ao enviar solicitação.", 'error');
            }
        } catch (error) {
            showToast("Erro de conexão.", 'error');
        }
    });
}

// ==========================================
// FORCE CHANGE PASSWORD LOGIC
// ==========================================
const forceChangePasswordForm = document.getElementById("force-change-password-form") as HTMLFormElement;
if (forceChangePasswordForm) {
    forceChangePasswordForm.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const oldPass = (document.getElementById("old_password") as HTMLInputElement).value;
        const newPass = (document.getElementById("new_password") as HTMLInputElement).value;
        const token = localStorage.getItem("access_token");
        
        try {
            const response = await fetch("http://localhost:8000/api/users/change-password/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ old_password: oldPass, new_password: newPass })
            });
            
            if (response.ok) {
                showToast("Senha alterada com sucesso!", 'success');
                const role = localStorage.getItem("user_role");
                setTimeout(() => {
                    window.location.href = role === "ADMIN" ? "admin-dashboard.html" : "medical-dashboard.html";
                }, 1500);
            } else {
                const data = await response.json();
                showToast("Erro ao alterar senha: " + (data?.detail ?? "Verifique os dados."), 'error');
            }
        } catch (error) {
            showToast("Erro de conexão.", 'error');
        }
    });
}

// ==========================================
// ADMIN DASHBOARD LOGIC
// ==========================================
const resetRequestsTbody = document.getElementById("reset-requests-tbody");
if (resetRequestsTbody) {
    requireAdmin();
    const fetchRequests = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch("http://localhost:8000/api/admin/reset-requests/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const requests = await response.json();
                resetRequestsTbody.innerHTML = "";
                requests.forEach((req: any) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${new Date(req.created_at).toLocaleString()}</td>
                        <td>${req.email}</td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="handleResetAction(${req.id}, 'APPROVE')">Aprovar</button>
                            <button class="btn btn-sm btn-danger" onclick="handleResetAction(${req.id}, 'REJECT')">Recusar</button>
                        </td>
                    `;
                    resetRequestsTbody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error("Erro ao buscar requisições:", error);
        }
    };

    (window as any).handleResetAction = async (id: number, action: string) => {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`http://localhost:8000/api/admin/reset-requests/${id}/action/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ action })
        });
        const data = await response.json();
        if (response.ok) {
            if (action === "APPROVE") {
                showToast(`Aprovado! Senha temporária: ${data.temporary_password}`, 'success', 12000);
            } else {
                showToast("Solicitação recusada com sucesso.", 'info');
            }
            fetchRequests();
        } else {
            showToast("Erro: " + (data?.detail ?? JSON.stringify(data)), 'error');
        }
    };

    fetchRequests();
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
}

// ==========================================
// DEVICES LOGIC (TASK 9)
// ==========================================
export interface Device {
    id: number;
    name: string;
    device_type: string;
    status: string;
    location: string;
    created_at: string;
    updated_at: string;
}

export async function fetchDevices(status?: string): Promise<Device[]> {
    const token = localStorage.getItem("access_token");
    const url = new URL("http://localhost:8000/api/devices/");
    if (status) url.searchParams.set("status", status);
    const response = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar dispositivos");
    }

    const data = await response.json();
    return data.results ? data.results : data;
}

// ==========================================
// RENDER DEVICES (TASK 10)
// ==========================================
const deviceMap = new Map<number, Device>();

export async function renderDevices(statusFilter?: string) {
    const medicalTbody = document.getElementById("devices-tbody");
    const adminTbody = document.getElementById("admin-devices-tbody");

    if (!medicalTbody && !adminTbody) return;

    try {
        const devices = await fetchDevices(statusFilter);
        
        if (medicalTbody) {
            medicalTbody.innerHTML = "";
            devices.forEach((device: Device) => {
                let badgeClass = "badge-available";
                if (device.status === "Em uso" || device.status === "IN_USE") badgeClass = "badge-inuse";
                if (device.status === "Manutenção" || device.status === "MAINTENANCE") badgeClass = "badge-maintenance";
                
                medicalTbody.innerHTML += `
                    <tr>
                        <td>${device.name}</td>
                        <td>${device.device_type}</td>
                        <td><span class="badge ${badgeClass}">${device.status}</span></td>
                        <td>${device.location}</td>
                    </tr>
                `;
            });
        }
        
        if (adminTbody) {
            adminTbody.innerHTML = "";
            deviceMap.clear();
            devices.forEach((device: Device) => {
                let badgeClass = "badge-available";
                if (device.status === "Em uso" || device.status === "IN_USE") badgeClass = "badge-inuse";
                if (device.status === "Manutenção" || device.status === "MAINTENANCE") badgeClass = "badge-maintenance";
                deviceMap.set(device.id, device);
                adminTbody.innerHTML += `
                    <tr>
                        <td>${device.name}</td>
                        <td>${device.device_type}</td>
                        <td><span class="badge ${badgeClass}">${device.status}</span></td>
                        <td>${device.location}</td>
                        <td>
                            <button class="btn btn-sm btn-success" style="margin-right: 0.5rem;" onclick="openEditModal(${device.id})">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteDevice(${device.id})">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        if (medicalTbody) medicalTbody.innerHTML = '<tr><td colspan="4">Erro ao carregar dispositivos.</td></tr>';
        if (adminTbody) adminTbody.innerHTML = '<tr><td colspan="5">Erro ao carregar dispositivos.</td></tr>';
    }
}

// ==========================================
// EDIT MODAL LOGIC
// ==========================================
const editModal     = document.getElementById("edit-modal") as HTMLElement | null;
const editForm      = document.getElementById("edit-device-form") as HTMLFormElement | null;
const editCancelBtn = document.getElementById("edit-cancel-btn") as HTMLButtonElement | null;

if (editModal && editForm && editCancelBtn) {
    editCancelBtn.addEventListener("click", () => {
        editModal.style.display = "none";
    });

    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) editModal.style.display = "none";
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id       = (document.getElementById("edit-device-id") as HTMLInputElement).value;
        const name     = (document.getElementById("edit-name") as HTMLInputElement).value.trim();
        const device_type = (document.getElementById("edit-type") as HTMLInputElement).value.trim();
        const status   = (document.getElementById("edit-status") as HTMLSelectElement).value;
        const location = (document.getElementById("edit-location") as HTMLInputElement).value.trim();

        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`http://localhost:8000/api/devices/${id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, device_type, status, location })
            });

            if (response.status === 401) {
                showToast("Sessão expirada. Faça login novamente.", 'error');
                setTimeout(() => { localStorage.clear(); window.location.href = "index.html"; }, 1500);
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                showToast("Erro ao salvar: " + (data?.detail ?? "Verifique os campos."), 'error');
                return;
            }

            editModal.style.display = "none";
            showToast("Dispositivo atualizado com sucesso!", 'success');
            renderDevices();
        } catch {
            showToast("Falha de conexão com o servidor.", 'error');
        }
    });
}

(window as any).openEditModal = (id: number) => {
    const device = deviceMap.get(id);
    if (!device || !editModal) return;
    (document.getElementById("edit-device-id") as HTMLInputElement).value = String(device.id);
    (document.getElementById("edit-name") as HTMLInputElement).value = device.name;
    (document.getElementById("edit-type") as HTMLInputElement).value = device.device_type;
    (document.getElementById("edit-status") as HTMLSelectElement).value = device.status;
    (document.getElementById("edit-location") as HTMLInputElement).value = device.location;
    editModal.style.display = "flex";
};

// ==========================================
// DELETE DEVICE LOGIC
// ==========================================
(window as any).deleteDevice = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este dispositivo? Esta ação não pode ser desfeita.")) return;

    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch(`http://localhost:8000/api/devices/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            showToast("Sessão expirada. Faça login novamente.", 'error');
            setTimeout(() => { localStorage.clear(); window.location.href = "index.html"; }, 1500);
            return;
        }

        if (response.status === 403) {
            showToast("Você não tem permissão para excluir este dispositivo.", 'error');
            return;
        }

        if (!response.ok) {
            showToast("Erro ao excluir dispositivo.", 'error');
            return;
        }

        showToast("Dispositivo excluído com sucesso!", 'success');
        renderDevices();
    } catch {
        showToast("Falha de conexão com o servidor.", 'error');
    }
};

if (document.getElementById("devices-tbody")) requireClinical();
if (document.getElementById("admin-devices-tbody")) requireAdmin();

const statusFilter = document.getElementById("status-filter") as HTMLSelectElement | null;
if (statusFilter) {
    statusFilter.addEventListener("change", () => {
        renderDevices(statusFilter.value || undefined);
    });
}

renderDevices();
