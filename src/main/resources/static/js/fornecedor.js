// src/main/resources/static/js/fornecedor.js
document.addEventListener("DOMContentLoaded", function() {
    const fornecedorForm = document.getElementById("fornecedorForm");
    if (fornecedorForm) {
        fornecedorForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const nomeInput = document.getElementById("nome");
            const cnpjInput = document.getElementById("cnpj");
            const telefoneInput = document.getElementById("telefone");

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
                const response = await fetchWithAuth("/api/fornecedores", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    Swal.fire('Sucesso!', 'Fornecedor cadastrado com sucesso!', 'success');
                    fornecedorForm.reset();
                } else {
                    const msg = await response.text();
                    Swal.fire('Erro!', `Não foi possível cadastrar o fornecedor: ${msg || response.statusText}`, 'error');
                }
            } catch (error) {
                console.error("Erro ao cadastrar fornecedor:", error);
                Swal.fire('Erro!', 'Erro de comunicação ao tentar cadastrar o fornecedor.', 'error');
            }
        });
    }
});