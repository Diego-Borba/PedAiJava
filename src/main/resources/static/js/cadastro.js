document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    
    // --- Referências aos Elementos ---
    const isMateriaPrimaCheckbox = document.getElementById('isMateriaPrima');
    const permiteComplementosCheckbox = document.getElementById('permiteComplementos');
    const containerComplementosDisponiveis = document.getElementById('containerComplementosDisponiveis');
    const containerReceita = document.getElementById('containerReceita');
    const btnAddComplementoConfig = document.getElementById('btnAddComplementoConfig');
    const btnAddReceita = document.getElementById('btnAddReceita');
    const listaComplementosConfig = document.getElementById('listaComplementosConfig');
    const listaReceita = document.getElementById('listaReceita');

    // --- Lógica de UI (Interatividade dos Checkboxes) ---
    isMateriaPrimaCheckbox.addEventListener('change', function() {
        containerReceita.style.display = this.checked ? 'none' : 'block';
        if (this.checked) {
            listaReceita.innerHTML = ''; // Limpa a receita se marcar como matéria-prima
        }
    });

    permiteComplementosCheckbox.addEventListener('change', function() {
        containerComplementosDisponiveis.style.display = this.checked ? 'block' : 'none';
        if (this.checked && listaComplementosConfig.children.length === 0) {
            adicionarLinhaComplementoConfig();
        }
    });

    // --- Funções para Adicionar Linhas ---
    if (btnAddComplementoConfig) {
        btnAddComplementoConfig.addEventListener('click', () => adicionarLinhaComplementoConfig());
    }
    if (btnAddReceita) {
        btnAddReceita.addEventListener('click', () => adicionarLinhaReceita());
    }

    function adicionarLinhaComplementoConfig() {
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center';
        div.innerHTML = `
            <div class="col-md-6"><input type="number" class="form-control form-control-sm complemento-id-input" placeholder="ID do Produto Complemento" required></div>
            <div class="col-md-4"><input type="number" class="form-control form-control-sm complemento-qtde-max-input" placeholder="Qtde Máx." value="1" min="1" required></div>
            <div class="col-md-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-comp-config"><i class="bi bi-trash"></i></button></div>`;
        listaComplementosConfig.appendChild(div);
        div.querySelector('.btn-remover-comp-config').addEventListener('click', function() { this.closest('.row').remove(); });
    }

    function adicionarLinhaReceita() {
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center receita-item-row';
        div.innerHTML = `
            <div class="col-md-6"><input type="number" class="form-control form-control-sm ingrediente-id-input" placeholder="ID do Produto Ingrediente" required></div>
            <div class="col-md-4"><input type="number" step="0.001" class="form-control form-control-sm ingrediente-qtde-input" placeholder="Qtde. Utilizada" required></div>
            <div class="col-md-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-receita-item"><i class="bi bi-trash"></i></button></div>`;
        listaReceita.appendChild(div);
        div.querySelector('.btn-remover-receita-item').addEventListener('click', function() { this.closest('.receita-item-row').remove(); });
    }

    // --- Submissão do Formulário ---
    if (formProduto) {
        formProduto.addEventListener('submit', function (e) {
            e.preventDefault();

            const complementosDisponiveis = [];
            if (permiteComplementosCheckbox.checked) {
                document.querySelectorAll('#listaComplementosConfig .row').forEach(row => {
                    const idInput = row.querySelector('.complemento-id-input');
                    const qtdeInput = row.querySelector('.complemento-qtde-max-input');
                    if (idInput?.value && qtdeInput?.value) {
                        complementosDisponiveis.push({ complementoProdutoId: parseInt(idInput.value), maxQtdePermitida: parseInt(qtdeInput.value) });
                    }
                });
            }

            const receita = [];
            if (!isMateriaPrimaCheckbox.checked) {
                document.querySelectorAll('#listaReceita .receita-item-row').forEach(row => {
                    const idInput = row.querySelector('.ingrediente-id-input');
                    const qtdeInput = row.querySelector('.ingrediente-qtde-input');
                    if (idInput?.value && qtdeInput?.value) {
                        receita.push({ produtoIngredienteId: parseInt(idInput.value), quantidadeUtilizada: parseFloat(qtdeInput.value) });
                    }
                });
            }

            const produto = {
                nome: document.getElementById('nome').value,
                preco: parseFloat(document.getElementById('preco').value),
                qtdeMax: parseInt(document.getElementById('qtdeMax').value),
                categoria: document.getElementById('categoria').value,
                codPdv: document.getElementById('codigoPdv').value ? parseInt(document.getElementById('codigoPdv').value) : null,
                descricao: document.getElementById('descricao').value,
                ordemVisualizacao: document.getElementById('ordemVisualizacao').value ? parseInt(document.getElementById('ordemVisualizacao').value) : 0,
                imagem: document.getElementById('imagem').value,
                ativo: true,
                isMateriaPrima: isMateriaPrimaCheckbox.checked,
                isComplemento: document.getElementById('isComplemento').checked,
                permiteComplementos: permiteComplementosCheckbox.checked,
                complementosDisponiveis: complementosDisponiveis,
                receita: receita
            };

            fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            })
            .then(res => {
                if (!res.ok) { return res.text().then(text => { throw new Error(text || `Erro ${res.status}`) }); }
                return res.json();
            })
            .then(data => {
                Swal.fire('Sucesso!', `Produto "${data.nome}" cadastrado com ID: ${data.id}!`, 'success');
                formProduto.reset();
                listaComplementosConfig.innerHTML = ''; 
                containerComplementosDisponiveis.style.display = 'none';
                listaReceita.innerHTML = '';
                containerReceita.style.display = 'block';
            })
            .catch(error => {
                Swal.fire('Erro!', `Erro ao cadastrar produto: ${error.message}`, 'error');
            });
        });
    }
});