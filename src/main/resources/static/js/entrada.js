// static/js/entrada.js
document.addEventListener("DOMContentLoaded", function() {
    let contadorItem = 0;

    // Adiciona um item inicial se não houver nenhum
    if (document.getElementById("itensContainer") && document.getElementById("itensContainer").children.length === 0) {
        adicionarItem();
    }
    
    carregarFornecedores(); // Carrega fornecedores ao iniciar

    const entradaForm = document.getElementById("entradaForm");
    if(entradaForm){
        entradaForm.addEventListener("submit", async function (event) {
            event.preventDefault();
    
            const fornecedorId = document.getElementById("fornecedorId").value;
            const tipoDocumento = document.getElementById("tipoDocumento").value;
    
            if (!fornecedorId) {
                Swal.fire('Atenção!', 'Por favor, selecione um fornecedor.', 'warning');
                return;
            }
            if (!tipoDocumento) {
                 Swal.fire('Atenção!', 'Por favor, informe o tipo do documento.', 'warning');
                return;
            }
    
            const itens = [];
            const itemBlocos = document.querySelectorAll(".item-bloco");
    
            if (itemBlocos.length === 0) {
                Swal.fire('Atenção!', 'Adicione pelo menos um item à entrada.', 'warning');
                return;
            }
    
            let formValido = true;
            itemBlocos.forEach((bloco, index) => {
                // Os nomes dos campos não precisam mais do contadorItem se buscamos pelo índice do bloco
                const produtoIdInput = bloco.querySelector(`input[name^="produtoId"]`);
                const quantidadeInput = bloco.querySelector(`input[name^="quantidade"]`);
                const precoUnitarioInput = bloco.querySelector(`input[name^="precoUnitario"]`);
                const fatorEntradaInput = bloco.querySelector(`input[name^="fatorEntrada"]`);
    
                const produtoId = produtoIdInput ? produtoIdInput.value : null;
                const quantidade = quantidadeInput ? quantidadeInput.value : null;
                const precoUnitario = precoUnitarioInput ? precoUnitarioInput.value : null;
                const fatorEntrada = fatorEntradaInput ? fatorEntradaInput.value : null;
    
                if (!produtoId || !quantidade || !precoUnitario || !fatorEntrada) {
                    formValido = false;
                    // Adicionar feedback visual de erro nos campos, se desejado
                    [produtoIdInput, quantidadeInput, precoUnitarioInput, fatorEntradaInput].forEach(input => {
                        if (input && !input.value) input.classList.add('is-invalid');
                        else if (input) input.classList.remove('is-invalid');
                    });
                } else {
                     [produtoIdInput, quantidadeInput, precoUnitarioInput, fatorEntradaInput].forEach(input => {
                        if (input) input.classList.remove('is-invalid');
                    });
                    itens.push({
                        produtoId: parseInt(produtoId),
                        quantidade: parseFloat(quantidade),
                        precoUnitario: parseFloat(precoUnitario),
                        fatorEntrada: parseFloat(fatorEntrada)
                    });
                }
            });
    
            if (!formValido) {
                Swal.fire('Atenção!', 'Preencha todos os campos dos itens.', 'warning');
                return;
            }
    
            const payload = {
                fornecedorId: parseInt(fornecedorId),
                tipoDocumento,
                itens
            };
    
            try {
                const response = await fetch('/api/entradas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
    
                if (response.ok) {
                    Swal.fire('Sucesso!', 'Entrada registrada com sucesso!', 'success');
                    entradaForm.reset();
                    document.getElementById("itensContainer").innerHTML = "";
                    adicionarItem(); // Adiciona um novo item em branco
                    // Limpar mensagens de erro/sucesso anteriores (se não usar Swal)
                    // document.getElementById("sucessoMsg").classList.remove("d-none");
                    // document.getElementById("erroMsg").classList.add("d-none");
                } else {
                    const msg = await response.text(); // Tenta pegar a mensagem de erro do corpo
                    Swal.fire('Erro!', `Falha ao registrar entrada: ${msg || response.statusText}`, 'error');
                    // document.getElementById("erroMsg").textContent = msg || `Erro: ${response.status}`;
                    // document.getElementById("erroMsg").classList.remove("d-none");
                    // document.getElementById("sucessoMsg").classList.add("d-none");
                }
            } catch (error) {
                console.error("Erro ao registrar entrada:", error);
                Swal.fire('Erro!', 'Erro de comunicação ao registrar entrada.', 'error');
                // document.getElementById("erroMsg").textContent = "Erro de comunicação ao registrar entrada.";
                // document.getElementById("erroMsg").classList.remove("d-none");
                // document.getElementById("sucessoMsg").classList.add("d-none");
            }
        });
    }
});

// Mova a declaração de adicionarItem e removerItem para o escopo global ou anexe-as ao window
// se forem chamadas diretamente do HTML (onclick="adicionarItem()")
// No entanto, é melhor adicionar event listeners. Mas para manter a estrutura original do onclick:
window.adicionarItem = function() {
    const container = document.getElementById("itensContainer");
    // contadorItem global não é mais necessário se os nomes dos campos não o usam
    // let localContador = container.children.length; // Para nomes únicos se necessário, mas não usado abaixo

    const itemHTML = `
      <div class="row mb-3 item-bloco gx-2"> {/* gx-2 para espaçamento entre colunas */}
        <div class="col-md-3">
          <label class="form-label small">Produto ID</label>
          <input type="number" class="form-control form-control-sm" placeholder="ID do Produto" name="produtoId" required>
        </div>
        <div class="col-md-2">
          <label class="form-label small">Quantidade</label>
          <input type="number" step="0.01" class="form-control form-control-sm" placeholder="Qtde" name="quantidade" required>
        </div>
        <div class="col-md-3">
          <label class="form-label small">Preço Unit.</label>
          <input type="number" step="0.01" class="form-control form-control-sm" placeholder="Preço Unit." name="precoUnitario" required>
        </div>
        <div class="col-md-2">
          <label class="form-label small">Fator Entrada</label>
          <input type="number" step="0.01" class="form-control form-control-sm" placeholder="Fator" name="fatorEntrada" required>
        </div>
        <div class="col-md-2 d-flex align-items-end"> {/* Botão alinhado em baixo */}
          <button type="button" class="btn btn-danger btn-sm w-100" onclick="removerItem(this)">Remover</button>
        </div>
      </div>`;
    
    container.insertAdjacentHTML("beforeend", itemHTML);
}

window.removerItem = function(button) {
    const itemBloco = button.closest(".item-bloco");
    if (itemBloco) {
        itemBloco.remove();
    }
    // Se for o último item, não permitir remover ou adicionar um novo automaticamente
    const container = document.getElementById("itensContainer");
    if (container && container.children.length === 0) {
        adicionarItem(); // Garante que sempre haja pelo menos um item
    }
}


async function carregarFornecedores() {
    try {
        const response = await fetch("/api/fornecedores");
        if (!response.ok) throw new Error("Erro ao buscar fornecedores.");
        const fornecedores = await response.json();

        const select = document.getElementById("fornecedorId");
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um fornecedor</option>'; // Limpa e adiciona placeholder

        fornecedores.forEach(f => {
            const option = document.createElement("option");
            option.value = f.id;
            option.textContent = f.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
        const erroMsgContainer = document.getElementById("erroMsg"); // Supondo que você tenha um container para erros
        if (erroMsgContainer) {
            erroMsgContainer.textContent = "Erro ao carregar fornecedores.";
            erroMsgContainer.classList.remove("d-none");
        } else {
            Swal.fire('Erro!', 'Não foi possível carregar os fornecedores.', 'error');
        }
    }
}