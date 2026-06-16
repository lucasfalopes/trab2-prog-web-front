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
                alert("Erro ao fazer login: " + (errorData.detail || "Credenciais inválidas."));
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro de conexão com o servidor. Verifique se o backend está rodando.");
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
                alert("Sua solicitação foi enviada aos administradores.");
                window.location.href = "index.html";
            } else {
                alert("Erro ao enviar solicitação.");
            }
        } catch (error) {
            alert("Erro de conexão.");
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
                alert("Senha alterada com sucesso!");
                const role = localStorage.getItem("user_role");
                window.location.href = role === "ADMIN" ? "admin-dashboard.html" : "medical-dashboard.html";
            } else {
                const data = await response.json();
                alert("Erro ao alterar senha: " + JSON.stringify(data));
            }
        } catch (error) {
            alert("Erro de conexão.");
        }
    });
}

// ==========================================
// ADMIN DASHBOARD LOGIC
// ==========================================
const resetRequestsTbody = document.getElementById("reset-requests-tbody");
if (resetRequestsTbody) {
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
                alert(`Solicitação Aprovada!\n\nSenha Temporária Gerada: ${data.temporary_password}\n\nCopie essa senha e entregue manualmente ao usuário.`);
            } else {
                alert("Solicitação Recusada e removida com sucesso.");
            }
            fetchRequests(); // Atualiza a lista
        } else {
            alert("Erro: " + JSON.stringify(data));
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
