var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { requireAdmin, requireClinical } from './router.js';
import { showToast } from './toast.js';
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const username = usernameInput.value;
        const password = passwordInput.value;
        try {
            // /api/token/ retorna access, refresh, role (ADMIN|CLINICAL) e must_change_password
            const response = yield fetch("http://localhost:8000/api/token/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = yield response.json();
                // Persiste credenciais no localStorage — usadas em todas as requisições autenticadas
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user_role", data.role);
                localStorage.setItem("username", data.username);
                // must_change_password é ativado pelo admin ao aprovar um reset de senha
                if (data.must_change_password) {
                    window.location.href = "force-change-password.html";
                }
                else if (data.role === "ADMIN") {
                    window.location.href = "admin-dashboard.html";
                }
                else {
                    window.location.href = "medical-dashboard.html";
                }
            }
            else {
                const errorData = yield response.json();
                showToast("Erro ao fazer login: " + (errorData.detail || "Credenciais inválidas."), 'error');
            }
        }
        catch (error) {
            console.error("Erro na requisição:", error);
            showToast("Erro de conexão com o servidor.", 'error');
        }
    }));
}
// ==========================================
// FORGOT PASSWORD LOGIC
// ==========================================
const forgotPasswordForm = document.getElementById("forgot-password-form");
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const emailInput = document.getElementById("email");
        try {
            const response = yield fetch("http://localhost:8000/api/users/reset-request/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value })
            });
            if (response.ok) {
                showToast("Sua solicitação foi enviada aos administradores.", 'success');
                setTimeout(() => { window.location.href = "index.html"; }, 1500);
            }
            else {
                showToast("Erro ao enviar solicitação.", 'error');
            }
        }
        catch (error) {
            showToast("Erro de conexão.", 'error');
        }
    }));
}
// ==========================================
// FORCE CHANGE PASSWORD LOGIC
// ==========================================
const forceChangePasswordForm = document.getElementById("force-change-password-form");
if (forceChangePasswordForm) {
    forceChangePasswordForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const oldPass = document.getElementById("old_password").value;
        const newPass = document.getElementById("new_password").value;
        const token = localStorage.getItem("access_token");
        try {
            const response = yield fetch("http://localhost:8000/api/users/change-password/", {
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
            }
            else {
                const data = yield response.json();
                showToast("Erro ao alterar senha: " + ((_a = data === null || data === void 0 ? void 0 : data.detail) !== null && _a !== void 0 ? _a : "Verifique os dados."), 'error');
            }
        }
        catch (error) {
            showToast("Erro de conexão.", 'error');
        }
    }));
}
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
}
let activeTab = 'devices';
export function fetchItems(status) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem("access_token");
        const url = new URL(`http://localhost:8000/api/${activeTab}/`);
        if (status && activeTab === 'devices')
            url.searchParams.set("status", status);
        const response = yield fetch(url.toString(), {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "index.html";
            return [];
        }
        if (!response.ok) {
            throw new Error(`Erro ao buscar ${activeTab}`);
        }
        const data = yield response.json();
        return data.results ? data.results : data;
    });
}
const deviceMap = new Map();
export function renderItems(statusFilter) {
    return __awaiter(this, void 0, void 0, function* () {
        const medicalTbody = document.getElementById("devices-tbody");
        const adminTbody = document.getElementById("admin-devices-tbody");
        if (!medicalTbody && !adminTbody)
            return;
        try {
            const items = yield fetchItems(statusFilter);
            // Painel CLINICAL: somente leitura — sem coluna de ações
            if (medicalTbody) {
                medicalTbody.innerHTML = "";
                items.forEach((item) => {
                    let statusOrQtyHtml = "";
                    if (activeTab === 'devices') {
                        let badgeClass = "badge-available";
                        if (item.status === "Em uso" || item.status === "IN_USE")
                            badgeClass = "badge-inuse";
                        if (item.status === "Manutenção" || item.status === "MAINTENANCE")
                            badgeClass = "badge-maintenance";
                        statusOrQtyHtml = `<span class="badge ${badgeClass}">${item.status}</span>`;
                    }
                    else {
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
                items.forEach((item) => {
                    let statusOrQtyHtml = "";
                    if (activeTab === 'devices') {
                        let badgeClass = "badge-available";
                        if (item.status === "Em uso" || item.status === "IN_USE")
                            badgeClass = "badge-inuse";
                        if (item.status === "Manutenção" || item.status === "MAINTENANCE")
                            badgeClass = "badge-maintenance";
                        statusOrQtyHtml = `<span class="badge ${badgeClass}">${item.status}</span>`;
                    }
                    else {
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
        }
        catch (error) {
            if (medicalTbody)
                medicalTbody.innerHTML = `<tr><td colspan="4">Erro ao carregar ${activeTab}.</td></tr>`;
            if (adminTbody)
                adminTbody.innerHTML = `<tr><td colspan="5">Erro ao carregar ${activeTab}.</td></tr>`;
        }
    });
}
// Tabs Logic
const tabDevices = document.getElementById("tab-devices");
const tabUtensils = document.getElementById("tab-utensils");
if (tabDevices && tabUtensils) {
    tabDevices.addEventListener("click", () => {
        var _a, _b;
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
        if (thStatusQty)
            thStatusQty.innerText = "Status";
        const filterContainer = (_a = document.getElementById("status-filter")) === null || _a === void 0 ? void 0 : _a.parentElement;
        if (filterContainer)
            filterContainer.style.display = "block";
        const filter = (_b = document.getElementById("status-filter")) === null || _b === void 0 ? void 0 : _b.value;
        renderItems(filter || undefined);
    });
    tabUtensils.addEventListener("click", () => {
        var _a, _b;
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
        if (thStatusQty)
            thStatusQty.innerText = "Quantidade";
        const filterContainer = (_a = document.getElementById("status-filter")) === null || _a === void 0 ? void 0 : _a.parentElement;
        if (filterContainer)
            filterContainer.style.display = "none";
        const filter = (_b = document.getElementById("status-filter")) === null || _b === void 0 ? void 0 : _b.value;
        renderItems(filter || undefined);
    });
}
// ==========================================
// EDIT MODAL LOGIC
// ==========================================
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-device-form");
const editCancelBtn = document.getElementById("edit-cancel-btn");
if (editModal && editForm && editCancelBtn) {
    editCancelBtn.addEventListener("click", () => {
        editModal.style.display = "none";
    });
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal)
            editModal.style.display = "none";
    });
    editForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const id = document.getElementById("edit-device-id").value;
        const name = document.getElementById("edit-name").value.trim();
        const type_val = document.getElementById("edit-type").value.trim();
        const location = document.getElementById("edit-location").value.trim();
        const payload = { name, location };
        if (activeTab === 'devices') {
            payload.device_type = type_val;
            payload.status = document.getElementById("edit-status").value;
        }
        else {
            payload.utensil_type = type_val;
            payload.quantity = parseInt(document.getElementById("edit-quantity").value, 10);
        }
        const token = localStorage.getItem("access_token");
        try {
            const response = yield fetch(`http://localhost:8000/api/${activeTab}/${id}/`, {
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
                const data = yield response.json();
                showToast("Erro ao salvar: " + ((_a = data === null || data === void 0 ? void 0 : data.detail) !== null && _a !== void 0 ? _a : "Verifique os campos."), 'error');
                return;
            }
            editModal.style.display = "none";
            showToast("Item atualizado com sucesso!", 'success');
            renderItems();
        }
        catch (_b) {
            showToast("Falha de conexão com o servidor.", 'error');
        }
    }));
}
window.openEditModal = (id) => {
    const item = deviceMap.get(id);
    if (!item || !editModal)
        return;
    document.getElementById("edit-device-id").value = String(item.id);
    document.getElementById("edit-name").value = item.name;
    document.getElementById("edit-type").value = item.device_type || item.utensil_type || '';
    document.getElementById("edit-location").value = item.location;
    const statusGroup = document.getElementById("edit-status-group");
    const qtyGroup = document.getElementById("edit-quantity-group");
    if (activeTab === 'devices') {
        if (statusGroup)
            statusGroup.style.display = "block";
        if (qtyGroup)
            qtyGroup.style.display = "none";
        document.getElementById("edit-status").value = item.status || "Disponível";
    }
    else {
        if (statusGroup)
            statusGroup.style.display = "none";
        if (qtyGroup)
            qtyGroup.style.display = "block";
        document.getElementById("edit-quantity").value = String(item.quantity || 0);
    }
    const title = document.getElementById("edit-modal-title");
    if (title)
        title.innerText = activeTab === 'devices' ? "Editar Dispositivo" : "Editar Utensílio";
    editModal.style.display = "flex";
};
// ==========================================
// DELETE DEVICE LOGIC
// ==========================================
window.deleteDevice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."))
        return;
    const token = localStorage.getItem("access_token");
    try {
        const response = yield fetch(`http://localhost:8000/api/${activeTab}/${id}/`, {
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
    }
    catch (_a) {
        showToast("Falha de conexão com o servidor.", 'error');
    }
});
// Identifica qual página está carregada pelo ID único de cada tbody e aplica o guard correspondente
if (document.getElementById("devices-tbody"))
    requireClinical();
if (document.getElementById("admin-devices-tbody"))
    requireAdmin();
const statusFilter = document.getElementById("status-filter");
if (statusFilter) {
    statusFilter.addEventListener("change", () => {
        renderItems(statusFilter.value || undefined);
    });
}
// ==========================================
// ADD DEVICE LOGIC
// ==========================================
const addModal = document.getElementById("add-modal");
const addBtn = document.getElementById("add-device-btn");
const addForm = document.getElementById("add-device-form");
const addCancelBtn = document.getElementById("add-cancel-btn");
if (addModal && addBtn && addForm && addCancelBtn) {
    addBtn.addEventListener("click", () => {
        addForm.reset();
        const statusGroup = document.getElementById("add-status-group");
        const qtyGroup = document.getElementById("add-quantity-group");
        if (activeTab === 'devices') {
            if (statusGroup)
                statusGroup.style.display = "block";
            if (qtyGroup)
                qtyGroup.style.display = "none";
        }
        else {
            if (statusGroup)
                statusGroup.style.display = "none";
            if (qtyGroup)
                qtyGroup.style.display = "block";
        }
        const title = document.getElementById("add-modal-title");
        if (title)
            title.innerText = activeTab === 'devices' ? "Adicionar Dispositivo" : "Adicionar Utensílio";
        addModal.style.display = "flex";
    });
    addCancelBtn.addEventListener("click", () => {
        addModal.style.display = "none";
    });
    addModal.addEventListener("click", (e) => {
        if (e.target === addModal)
            addModal.style.display = "none";
    });
    addForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const name = document.getElementById("add-name").value.trim();
        const type_val = document.getElementById("add-type").value.trim();
        const location = document.getElementById("add-location").value.trim();
        const payload = { name, location };
        if (activeTab === 'devices') {
            payload.device_type = type_val;
            payload.status = document.getElementById("add-status").value;
        }
        else {
            payload.utensil_type = type_val;
            payload.quantity = parseInt(document.getElementById("add-quantity").value, 10);
        }
        const token = localStorage.getItem("access_token");
        try {
            const response = yield fetch(`http://localhost:8000/api/${activeTab}/`, {
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
                const data = yield response.json();
                showToast("Erro ao adicionar: " + ((_a = data === null || data === void 0 ? void 0 : data.detail) !== null && _a !== void 0 ? _a : "Verifique os campos."), 'error');
                return;
            }
            addModal.style.display = "none";
            showToast("Item adicionado com sucesso!", 'success');
            renderItems();
        }
        catch (_b) {
            showToast("Falha de conexão com o servidor.", 'error');
        }
    }));
}
renderItems();
