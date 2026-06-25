import { requireAdmin } from './router.js';
import { showToast } from './toast.js';

// Página exclusiva de ADMIN — redireciona qualquer outro perfil imediatamente
requireAdmin();

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
}

// ==========================================
// ADMIN RESET REQUESTS LOGIC
// ==========================================
const resetRequestsTbody = document.getElementById("reset-requests-tbody");
if (resetRequestsTbody) {
    const fetchRequests = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch("https://lucasfalopes.pythonanywhere.com/api/admin/reset-requests/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const requests = await response.json();
                resetRequestsTbody.innerHTML = "";
                requests.forEach((req) => {
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

    (window).handleResetAction = async (id, action) => {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`https://lucasfalopes.pythonanywhere.com/api/admin/reset-requests/${id}/action/`, {
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
                const modal = document.getElementById("temp-password-modal");
                const display = document.getElementById("temp-password-display");
                if (modal && display) {
                    display.innerText = data.temporary_password;
                    modal.style.display = "flex";
                } else {
                    showToast(`Aprovado! Senha temporária: ${data.temporary_password}`, 'success', 12000);
                }
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

const closeTempModalBtn = document.getElementById("close-temp-modal-btn");
if (closeTempModalBtn) {
    closeTempModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("temp-password-modal");
        if (modal) modal.style.display = "none";
    });
}

// ==========================================
// CREATE USER LOGIC
// ==========================================
const createUserModal = document.getElementById("create-user-modal");
const createUserBtn   = document.getElementById("create-user-btn");
const createUserForm  = document.getElementById("create-user-form");
const createUserCancelBtn = document.getElementById("create-user-cancel-btn");

if (createUserModal && createUserBtn && createUserForm && createUserCancelBtn) {
    createUserBtn.addEventListener("click", () => {
        createUserForm.reset();
        createUserModal.style.display = "flex";
    });

    createUserCancelBtn.addEventListener("click", () => {
        createUserModal.style.display = "none";
    });

    createUserModal.addEventListener("click", (e) => {
        if (e.target === createUserModal) createUserModal.style.display = "none";
    });

    createUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("access_token");
        const payload = {
            username:   (document.getElementById("create-user-username")).value.trim(),
            first_name: (document.getElementById("create-user-firstname")).value.trim(),
            last_name:  (document.getElementById("create-user-lastname")).value.trim(),
            email:      (document.getElementById("create-user-email")).value.trim(),
            role:       (document.getElementById("create-user-role")).value,
            password:   (document.getElementById("create-user-password")).value,
        };
        try {
            const response = await fetch("https://lucasfalopes.pythonanywhere.com/api/admin/users/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast("Usuário criado com sucesso!", 'success');
                createUserModal.style.display = "none";
                (window).fetchUsersGlobal?.();
            } else {
                const data = await response.json();
                const msg = JSON.stringify(data);
                showToast("Erro ao criar: " + msg, 'error');
            }
        } catch {
            showToast("Erro de conexão.", 'error');
        }
    });
}

// ==========================================
// ADMIN USERS LOGIC
// ==========================================
const usersTbody = document.getElementById("users-tbody");
const userMap = new Map();

if (usersTbody) {
    const fetchUsers = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch("https://lucasfalopes.pythonanywhere.com/api/admin/users/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const json = await response.json();
                const users = json.results ?? json;
                usersTbody.innerHTML = "";
                userMap.clear();
                users.forEach((u) => {
                    userMap.set(u.id, u);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${u.first_name} ${u.last_name}</td>
                        <td>${u.username}</td>
                        <td>${u.email}</td>
                        <td>${u.role === 'ADMIN' ? 'Engenheiro' : 'Médico / Enfermeiro'}</td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="openEditUserModal(${u.id})">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Excluir</button>
                        </td>
                    `;
                    usersTbody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        }
    };

    (window).deleteUser = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`https://lucasfalopes.pythonanywhere.com/api/admin/users/${id}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                showToast("Usuário excluído com sucesso.", 'success');
                fetchUsers();
            } else {
                showToast("Erro ao excluir usuário.", 'error');
            }
        } catch (error) {
            showToast("Erro de conexão.", 'error');
        }
    };

    (window).fetchUsersGlobal = fetchUsers;
    fetchUsers();

    // Edit modal logic
    const editModal = document.getElementById("edit-user-modal");
    const editForm = document.getElementById("edit-user-form");
    const editCancelBtn = document.getElementById("edit-user-cancel-btn");

    if (editModal && editForm && editCancelBtn) {
        editCancelBtn.addEventListener("click", () => {
            editModal.style.display = "none";
        });

        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = (document.getElementById("edit-user-id")).value;
            const payload = {
                first_name: (document.getElementById("edit-user-firstname")).value,
                last_name: (document.getElementById("edit-user-lastname")).value,
                email: (document.getElementById("edit-user-email")).value,
                role: (document.getElementById("edit-user-role")).value,
            };

            const token = localStorage.getItem("access_token");
            try {
                const response = await fetch(`https://lucasfalopes.pythonanywhere.com/api/admin/users/${id}/`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    showToast("Usuário atualizado com sucesso.", 'success');
                    editModal.style.display = "none";
                    fetchUsers();
                } else {
                    const data = await response.json();
                    showToast("Erro ao atualizar: " + JSON.stringify(data), 'error');
                }
            } catch (error) {
                showToast("Erro de conexão.", 'error');
            }
        });

        (window).openEditUserModal = (id) => {
            const user = userMap.get(id);
            if (!user) return;
            (document.getElementById("edit-user-id")).value = String(user.id);
            (document.getElementById("edit-user-firstname")).value = user.first_name || "";
            (document.getElementById("edit-user-lastname")).value = user.last_name || "";
            (document.getElementById("edit-user-email")).value = user.email || "";
            (document.getElementById("edit-user-role")).value = user.role || "CLINICAL";
            editModal.style.display = "flex";
        };
    }
}
