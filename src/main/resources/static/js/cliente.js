// src/main/resources/static/js/cliente.js
document.addEventListener("DOMContentLoaded", function () {
    const clienteForm = document.getElementById("clienteForm");
    const cepInput = document.getElementById('cep');
    const statusDiv = document.getElementById('cep-status');
    const logradouroInput = document.getElementById('logradouro');
    const numeroInput = document.getElementById('numero');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');

    // --- Lógica de Preenchimento Automático de CEP (via ViaCEP) ---
    cepInput.addEventListener('blur', async (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            statusDiv.textContent = '';
            return;
        }
        statusDiv.textContent = 'Buscando...';
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado.');
            const data = await response.json();
            if (data.erro) throw new Error('CEP inválido.');
            
            // Preenche os campos
            logradouroInput.value = data.logradouro;
            bairroInput.value = data.bairro;
            cidadeInput.value = data.localidade;
            estadoInput.value = data.uf;
            
            statusDiv.textContent = 'Endereço encontrado!';
            statusDiv.classList.remove('text-danger');
            statusDiv.classList.add('text-success');
            numeroInput.focus();
        } catch (error) {
            statusDiv.textContent = error.message;
            statusDiv.classList.remove('text-success');
            statusDiv.classList.add('text-danger');
        }
    });

    // --- Lógica de Submissão do Formulário ---
    if (clienteForm) {
        clienteForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            
            // Validação de Nome e Telefone (obrigatório)
            const nome = document.getElementById('nome').value.trim();
            const telefone = document.getElementById('telefone').value.trim();

            if (!nome || !telefone) {
                Swal.fire('Atenção!', 'O Nome e o Telefone são campos obrigatórios.', 'warning');
                clienteForm.classList.add('was-validated');
                return;
            }

            const payload = {
                nome: nome,
                telefone: telefone,
                email: document.getElementById('email').value.trim() || null, // Opcional
                
                // Endereço
                endereco: {
                    cep: cepInput.value.trim(),
                    logradouro: logradouroInput.value.trim(),
                    numero: numeroInput.value.trim(),
                    complemento: document.getElementById('complemento').value.trim(),
                    bairro: bairroInput.value.trim(),
                    cidade: cidadeInput.value.trim(),
                    estado: estadoInput.value.trim(),
                    ponto_referencia: document.getElementById('ponto_referencia').value.trim(),
                }
            };
            
            // Se nenhum campo de endereço foi preenchido, envia null para o endereço
            const enderecoVazio = Object.values(payload.endereco).every(val => !val || val === "");
            if (enderecoVazio) {
                payload.endereco = null;
            }


            try {
                // Nova rota para cadastro via ADMIN
                const response = await fetchWithAuth("/api/clientes/admin-cadastro", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    Swal.fire('Sucesso!', 'Cliente cadastrado com sucesso!', 'success');
                    clienteForm.reset();
                    clienteForm.classList.remove('was-validated');
                    statusDiv.textContent = '';
                } else {
                    const msg = await response.text();
                    Swal.fire('Erro!', `Não foi possível cadastrar o cliente: ${msg || response.statusText}`, 'error');
                }
            } catch (error) {
                console.error("Erro ao cadastrar cliente:", error);
                Swal.fire('Erro!', 'Erro de comunicação ao tentar cadastrar o cliente.', 'error');
            }
        });
    }
});