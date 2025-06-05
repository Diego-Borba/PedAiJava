// static/js/cadastro.js
document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    const permiteComplementosCheckbox = document.getElementById('permiteComplementos');
    const containerComplementosDisponiveis = document.getElementById('containerComplementosDisponiveis');
    const btnAddComplementoConfig = document.getElementById('btnAddComplementoConfig');
    const listaComplementosConfig = document.getElementById('listaComplementosConfig');

    if (permiteComplementosCheckbox) {
        permiteComplementosCheckbox.addEventListener('change', function() {
            containerComplementosDisponiveis.style.display = this.checked ? 'block' : 'none';
            if (this.checked && listaComplementosConfig.children.length === 0) {
                adicionarLinhaComplementoConfig(); // Adiciona uma linha inicial se estiver vazio
            }
        });
    }

    if (btnAddComplementoConfig) {
        btnAddComplementoConfig.addEventListener('click', adicionarLinhaComplementoConfig);
    }

    function adicionarLinhaComplementoConfig(config = { complementoProdutoId: '', maxQtdePermitida: 1 }) {
        if (!listaComplementosConfig) return;
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center';
        div.innerHTML = `
            <div class="col-md-6">
                <input type="number" class="form-control form-control-sm complemento-id-input" placeholder="ID do Produto Complemento" value="${config.complementoProdutoId || ''}" required>
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control form-control-sm complemento-qtde-max-input" placeholder="Qtde Máx." value="${config.maxQtdePermitida || 1}" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-danger w-100 btn-remover-comp-config"><i class="bi bi-trash"></i></button>
            </div>
        `;
        listaComplementosConfig.appendChild(div);
        div.querySelector('.btn-remover-comp-config').addEventListener('click', function() {
            this.closest('.row').remove();
        });
    }


    if (formProduto) {
        formProduto.addEventListener('submit', function (e) {
            e.preventDefault();

            const complementosDisponiveis = [];
            if (permiteComplementosCheckbox.checked) {
                document.querySelectorAll('#listaComplementosConfig .row').forEach(row => {
                    const idInput = row.querySelector('.complemento-id-input');
                    const qtdeInput = row.querySelector('.complemento-qtde-max-input');
                    if (idInput && qtdeInput && idInput.value && qtdeInput.value) {
                        complementosDisponiveis.push({
                            complementoProdutoId: parseInt(idInput.value),
                            maxQtdePermitida: parseInt(qtdeInput.value)
                        });
                    }
                });
            }

            const produto = {
                nome: document.getElementById('nome').value,
                preco: parseFloat(document.getElementById('preco').value),
                qtdeMax: parseInt(document.getElementById('qtdeMax').value),
                categoria: document.getElementById('categoria').value,
                codigoPdv: document.getElementById('codigoPdv').value ? parseInt(document.getElementById('codigoPdv').value) : null,
                descricao: document.getElementById('descricao').value,
                ordemVisualizacao: parseInt(document.getElementById('ordemVisualizacao').value) || 0,
                imagem: document.getElementById('imagem').value,
                ativo: true, // Default
                isComplemento: document.getElementById('isComplemento').checked,
                permiteComplementos: permiteComplementosCheckbox.checked,
                complementosDisponiveis: complementosDisponiveis
            };


            if (!produto.nome || isNaN(produto.preco) || isNaN(produto.qtdeMax)) {
                Swal.fire('Atenção!', 'Nome, Preço e Quantidade Máxima são obrigatórios e devem ser válidos.', 'warning');
                return;
            }
            if (produto.permiteComplementos && produto.complementosDisponiveis.length === 0) {
                 Swal.fire('Atenção!', 'Se "permite complementos" está marcado, adicione ao menos uma configuração de complemento disponível.', 'warning');
                return;
            }


            fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            })
            .then(res => {
                if (!res.ok) { 
                    return res.json().then(err => { throw new Error(err.message || `Erro ${res.status} do servidor`) });
                }
                return res.json();
            })
            .then(data => {
                Swal.fire('Sucesso!', `Produto "${data.nome}" cadastrado com ID: ${data.id}!`, 'success');
                formProduto.reset();
                listaComplementosConfig.innerHTML = ''; // Limpa as linhas de configuração
                containerComplementosDisponiveis.style.display = 'none';

            })
            .catch(error => {
                console.error('Erro ao cadastrar produto:', error);
                Swal.fire('Erro!', `Erro ao cadastrar produto: ${error.message}`, 'error');
            });
        });
    }
});