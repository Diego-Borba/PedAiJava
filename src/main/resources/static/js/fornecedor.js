// static/js/fornecedor.js
document.addEventListener("DOMContentLoaded", function() {
    const fornecedorForm = document.getElementById("fornecedorForm");
    if (fornecedorForm) {
        fornecedorForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const nomeInput = document.getElementById("nome");
            const cnpjInput = document.getElementById("cnpj");
            const telefoneInput = document.getElementById("telefone");

            // Validação simples
            if (!nomeInput.value.trim()) {
                Swal.fire('Atenção!', 'O nome do fornecedor é obrigatório.', 'warning');
                nomeInput.focus();
                return;
            }


            const payload = {
                nome: nomeInput.value,
                cnpj: cnpjInput.value,
                telefone: telefoneInput.value
            };

            try {
                const response = await fetch("/api/fornecedores", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                // const sucessoMsgDiv = document.getElementById("sucessoMsg");
                // const erroMsgDiv = document.getElementById("erroMsg");

                if (response.ok) {
                    Swal.fire('Sucesso!', 'Fornecedor cadastrado com sucesso!', 'success');
                    fornecedorForm.reset();
                    // sucessoMsgDiv.classList.remove("d-none");
                    // erroMsgDiv.classList.add("d-none");
                } else {
                    const msg = await response.text(); // Tenta obter mensagem do backend
                    Swal.fire('Erro!', `Não foi possível cadastrar o fornecedor: ${msg || response.statusText}`, 'error');
                    // erroMsgDiv.textContent = msg || `Erro: ${response.status}`;
                    // erroMsgDiv.classList.remove("d-none");
                    // sucessoMsgDiv.classList.add("d-none");
                }
            } catch (error) {
                console.error("Erro ao cadastrar fornecedor:", error);
                Swal.fire('Erro!', 'Erro de comunicação ao tentar cadastrar o fornecedor.', 'error');
                // document.getElementById("erroMsg").textContent = "Erro de comunicação ao cadastrar fornecedor.";
                // document.getElementById("erroMsg").classList.remove("d-none");
                // document.getElementById("sucessoMsg").classList.add("d-none");
            }
        });
    }
});