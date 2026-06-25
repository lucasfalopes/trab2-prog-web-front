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
            // /api/token/ retorna access, refresh, role (ADMIN|CLINICAL) e must_change_password
            const response = await fetch("http://localhost:8000/api/token/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();

                // Persiste credenciais no localStorage — usadas em todas as requisições autenticadas
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user_role", data.role);
                localStorage.setItem("username", data.username);

                // must_change_password é ativado pelo admin ao aprovar um reset de senha
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



const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
}

// ==========================================
// INVENTORY LOGIC (TASK 9 & 10)
// ==========================================
export interface Device {
    id: number;
    name: string;
    device_type?: string;
    utensil_type?: string;
    status?: string;
    quantity?: number;
    location: string;
    created_at: string;
    updated_at: string;
}

let activeTab: 'devices' | 'utensils' = 'devices';

export async function fetchItems(status?: string): Promise<Device[]> {
    const token = localStorage.getItem("access_token");
    const url = new URL(`http://localhost:8000/api/${activeTab}/`);
    if (status && activeTab === 'devices') url.searchParams.set("status", status);
    const response = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar ${activeTab}`);
    }

    const data = await response.json();
    return data.results ? data.results : data;
}

const deviceMap = new Map<number, Device>();

export async function renderItems(statusFilter?: string) {
    const medicalTbody = document.getElementById("devices-tbody");
    const adminTbody = document.getElementById("admin-devices-tbody");

    if (!medicalTbody && !adminTbody) return;

    try {
        const items = await fetchItems(statusFilter);
        
        // Painel CLINICAL: somente leitura — sem coluna de ações
        if (medicalTbody) {
            medicalTbody.innerHTML = "";
            items.forEach((item: Device) => {
                let statusOrQtyHtml = "";
                if (activeTab === 'devices') {
                    let badgeClass = "badge-available";
                    if (item.status === "Em uso" || item.status === "IN_USE") badgeClass = "badge-inuse";
                    if (item.status === "Manutenção" || item.status === "MAINTENANCE") badgeClass = "badge-maintenance";
                    statusOrQtyHtml = `<span class="badge ${badgeClass}">${item.status}</span>`;
                } else {
                    statusOrQtyHtml = `${item.quantity}`;
                }

                medicalTbody.innerHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.device_type || item.utensil_type}</td>
                        <td>${statusOrQtyHtml}</td>
                        <td>${item.location}</td>
                    </tr>
                `;
            });
        }

        // Painel ADMIN: armazena itens no deviceMap para o modal de edição acessar por id, e exibe botões de ação
        if (adminTbody) {
            adminTbody.innerHTML = "";
            deviceMap.clear();
            items.forEach((item: Device) => {
                let statusOrQtyHtml = "";
                if (activeTab === 'devices') {
                    let badgeClass = "badge-available";
                    if (item.status === "Em uso" || item.status === "IN_USE") badgeClass = "badge-inuse";
                    if (item.status === "Manutenção" || item.status === "MAINTENANCE") badgeClass = "badge-maintenance";
                    statusOrQtyHtml = `<span class="badge ${badgeClass}">${item.status}</span>`;
                } else {
                    statusOrQtyHtml = `${item.quantity}`;
                }

                deviceMap.set(item.id, item);
                adminTbody.innerHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.device_type || item.utensil_type}</td>
                        <td>${statusOrQtyHtml}</td>
                        <td>${item.location}</td>
                        <td>
                            <button class="btn btn-sm btn-success" style="margin-right: 0.5rem;" onclick="openEditModal(${item.id})">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteDevice(${item.id})">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        if (medicalTbody) medicalTbody.innerHTML = `<tr><td colspan="4">Erro ao carregar ${activeTab}.</td></tr>`;
        if (adminTbody) adminTbody.innerHTML = `<tr><td colspan="5">Erro ao carregar ${activeTab}.</td></tr>`;
    }
}

// Tabs Logic
const tabDevices = document.getElementById("tab-devices");
const tabUtensils = document.getElementById("tab-utensils");

if (tabDevices && tabUtensils) {
    tabDevices.addEventListener("click", () => {
        activeTab = 'devices';
        tabDevices.classList.add("active");
        tabDevices.style.borderBottom = "2px solid var(--primary-blue)";
        tabDevices.style.fontWeight = "bold";
        tabDevices.style.color = "initial";
        
        tabUtensils.classList.remove("active");
        tabUtensils.style.borderBottom = "none";
        tabUtensils.style.fontWeight = "normal";
        tabUtensils.style.color = "#666";
        
        const thStatusQty = document.getElementById("th-status-qty");
        if (thStatusQty) thStatusQty.innerText = "Status";
        const filterContainer = document.getElementById("status-filter")?.parentElement;
        if (filterContainer) filterContainer.style.display = "block";

        const filter = (document.getElementById("status-filter") as HTMLSelectElement)?.value;
        renderItems(filter || undefined);
    });

    tabUtensils.addEventListener("click", () => {
        activeTab = 'utensils';
        tabUtensils.classList.add("active");
        tabUtensils.style.borderBottom = "2px solid var(--primary-blue)";
        tabUtensils.style.fontWeight = "bold";
        tabUtensils.style.color = "initial";
        
        tabDevices.classList.remove("active");
        tabDevices.style.borderBottom = "none";
        tabDevices.style.fontWeight = "normal";
        tabDevices.style.color = "#666";
        
        const thStatusQty = document.getElementById("th-status-qty");
        if (thStatusQty) thStatusQty.innerText = "Quantidade";
        const filterContainer = document.getElementById("status-filter")?.parentElement;
        if (filterContainer) filterContainer.style.display = "none";

        const filter = (document.getElementById("status-filter") as HTMLSelectElement)?.value;
        renderItems(filter || undefined);
    });
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
        const type_val = (document.getElementById("edit-type") as HTMLInputElement).value.trim();
        const location = (document.getElementById("edit-location") as HTMLInputElement).value.trim();

        const payload: any = { name, location };
        if (activeTab === 'devices') {
            payload.device_type = type_val;
            payload.status = (document.getElementById("edit-status") as HTMLSelectElement).value;
        } else {
            payload.utensil_type = type_val;
            payload.quantity = parseInt((document.getElementById("edit-quantity") as HTMLInputElement).value, 10);
        }

        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`http://localhost:8000/api/${activeTab}/${id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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
            showToast("Item atualizado com sucesso!", 'success');
            renderItems();
        } catch {
            showToast("Falha de conexão com o servidor.", 'error');
        }
    });
}

(window as any).openEditModal = (id: number) => {
    const item = deviceMap.get(id);
    if (!item || !editModal) return;
    (document.getElementById("edit-device-id") as HTMLInputElement).value = String(item.id);
    (document.getElementById("edit-name") as HTMLInputElement).value = item.name;
    (document.getElementById("edit-type") as HTMLInputElement).value = item.device_type || item.utensil_type || '';
    (document.getElementById("edit-location") as HTMLInputElement).value = item.location;
    
    const statusGroup = document.getElementById("edit-status-group");
    const qtyGroup = document.getElementById("edit-quantity-group");
    if (activeTab === 'devices') {
        if (statusGroup) statusGroup.style.display = "block";
        if (qtyGroup) qtyGroup.style.display = "none";
        (document.getElementById("edit-status") as HTMLSelectElement).value = item.status || "Disponível";
    } else {
        if (statusGroup) statusGroup.style.display = "none";
        if (qtyGroup) qtyGroup.style.display = "block";
        (document.getElementById("edit-quantity") as HTMLInputElement).value = String(item.quantity || 0);
    }

    const title = document.getElementById("edit-modal-title");
    if(title) title.innerText = activeTab === 'devices' ? "Editar Dispositivo" : "Editar Utensílio";
    editModal.style.display = "flex";
};

// ==========================================
// DELETE DEVICE LOGIC
// ==========================================
(window as any).deleteDevice = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.")) return;

    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch(`http://localhost:8000/api/${activeTab}/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            showToast("Sessão expirada. Faça login novamente.", 'error');
            setTimeout(() => { localStorage.clear(); window.location.href = "index.html"; }, 1500);
            return;
        }

        if (response.status === 403) {
            showToast("Você não tem permissão para excluir este item.", 'error');
            return;
        }

        if (!response.ok) {
            showToast("Erro ao excluir item.", 'error');
            return;
        }

        showToast("Item excluído com sucesso!", 'success');
        renderItems();
    } catch {
        showToast("Falha de conexão com o servidor.", 'error');
    }
};

// Identifica qual página está carregada pelo ID único de cada tbody e aplica o guard correspondente
if (document.getElementById("devices-tbody")) requireClinical();
if (document.getElementById("admin-devices-tbody")) requireAdmin();

const statusFilter = document.getElementById("status-filter") as HTMLSelectElement | null;
if (statusFilter) {
    statusFilter.addEventListener("change", () => {
        renderItems(statusFilter.value || undefined);
    });
}

// ==========================================
// ADD DEVICE LOGIC
// ==========================================
const addModal = document.getElementById("add-modal") as HTMLElement | null;
const addBtn = document.getElementById("add-device-btn") as HTMLButtonElement | null;
const addForm = document.getElementById("add-device-form") as HTMLFormElement | null;
const addCancelBtn = document.getElementById("add-cancel-btn") as HTMLButtonElement | null;

if (addModal && addBtn && addForm && addCancelBtn) {
    addBtn.addEventListener("click", () => {
        addForm.reset();
        
        const statusGroup = document.getElementById("add-status-group");
        const qtyGroup = document.getElementById("add-quantity-group");
        if (activeTab === 'devices') {
            if (statusGroup) statusGroup.style.display = "block";
            if (qtyGroup) qtyGroup.style.display = "none";
        } else {
            if (statusGroup) statusGroup.style.display = "none";
            if (qtyGroup) qtyGroup.style.display = "block";
        }

        const title = document.getElementById("add-modal-title");
        if(title) title.innerText = activeTab === 'devices' ? "Adicionar Dispositivo" : "Adicionar Utensílio";
        addModal.style.display = "flex";
    });

    addCancelBtn.addEventListener("click", () => {
        addModal.style.display = "none";
    });

    addModal.addEventListener("click", (e) => {
        if (e.target === addModal) addModal.style.display = "none";
    });

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = (document.getElementById("add-name") as HTMLInputElement).value.trim();
        const type_val = (document.getElementById("add-type") as HTMLInputElement).value.trim();
        const location = (document.getElementById("add-location") as HTMLInputElement).value.trim();

        const payload: any = { name, location };
        if (activeTab === 'devices') {
            payload.device_type = type_val;
            payload.status = (document.getElementById("add-status") as HTMLSelectElement).value;
        } else {
            payload.utensil_type = type_val;
            payload.quantity = parseInt((document.getElementById("add-quantity") as HTMLInputElement).value, 10);
        }

        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`http://localhost:8000/api/${activeTab}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                showToast("Sessão expirada. Faça login novamente.", 'error');
                setTimeout(() => { localStorage.clear(); window.location.href = "index.html"; }, 1500);
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                showToast("Erro ao adicionar: " + (data?.detail ?? "Verifique os campos."), 'error');
                return;
            }

            addModal.style.display = "none";
            showToast("Item adicionado com sucesso!", 'success');
            renderItems();
        } catch {
            showToast("Falha de conexão com o servidor.", 'error');
        }
    });
}

renderItems();
