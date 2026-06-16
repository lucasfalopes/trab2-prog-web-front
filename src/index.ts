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
                
                // Redirecionar usuário para a dashboard pertinente (Ainda a ser implementado nas telas pelo Diogo/Você)
                if (data.role === "ADMIN") {
                    window.location.href = "dashboard-admin.html";
                } else {
                    window.location.href = "dashboard-medico.html";
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
