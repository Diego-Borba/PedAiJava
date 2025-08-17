// src/main/resources/static/js/cadastro.js
document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    if (!formProduto) return;

    // --- Referências aos Elementos ---
    const isMateriaPrimaCheckbox = document.getElementById('isMateriaPrima');
    const permiteComplementosCheckbox = document.getElementById('permiteComplementos');
    const isKitCheckbox = document.getElementById('isKit');
    const containerComplementosDisponiveis = document.getElementById('containerComplementosDisponiveis');
    const containerReceita = document.getElementById('containerReceita');
    const containerKit = document.getElementById('containerKit');
    const btnAddReceita = document.getElementById('btnAddReceita');
    const btnAddGrupoKit = document.getElementById('btnAddGrupoKit');
    const listaReceita = document.getElementById('listaReceita');
    const listaGruposKit = document.getElementById('listaGruposKit');

    let todosOsProdutos = []; // Cache para guardar todos os produtos para os selects

    // --- Carregamento Inicial de Dados ---
    async function carregarProdutosParaSelecao() {
        try {
            // CORREÇÃO: Usar a API que retorna TODOS os produtos para a seleção de componentes,
            // não apenas os produtos do cardápio.
            const response = await fetch('/api/produtos');
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            todosOsProdutos = await response.json();
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível carregar a lista de produtos para as opções de kit/receita.', 'error');
            console.error("Erro ao carregar produtos:", error);
        }
    }

    // --- Lógica de UI (Interatividade dos Checkboxes) ---
    isMateriaPrimaCheckbox.addEventListener('change', function () {
        containerReceita.style.display = this.checked ? 'none' : 'block';
        if (this.checked) listaReceita.innerHTML = '';
    });

    permiteComplementosCheckbox.addEventListener('change', function () {
        containerComplementosDisponiveis.style.display = this.checked ? 'block' : 'none';
    });

    isKitCheckbox.addEventListener('change', function () {
        containerKit.style.display = this.checked ? 'block' : 'none';
        if (this.checked && listaGruposKit.children.length === 0) {
            adicionarLinhaGrupoKit();
        }
    });

    // --- Funções para Adicionar Linhas Dinâmicas ---
    btnAddReceita?.addEventListener('click', () => adicionarLinhaReceita());
    btnAddGrupoKit?.addEventListener('click', () => adicionarLinhaGrupoKit());

    function adicionarLinhaReceita() {
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center receita-item-row';
        div.innerHTML = `
            <div class="col-md-6"><input type="number" class="form-control form-control-sm ingrediente-id-input" placeholder="ID do Produto Ingrediente" required></div>
            <div class="col-md-4"><input type="number" step="0.001" class="form-control form-control-sm ingrediente-qtde-input" placeholder="Qtde. Utilizada" required></div>
            <div class="col-md-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover"><i class="bi bi-trash"></i></button></div>`;
        listaReceita.appendChild(div);
        div.querySelector('.btn-remover').addEventListener('click', function () { this.closest('.receita-item-row').remove(); });
    }

    function adicionarLinhaGrupoKit() {
        const divGrupo = document.createElement('div');
        divGrupo.className = 'p-3 border rounded mb-3 bg-white shadow-sm grupo-kit-bloco';
        divGrupo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Novo Grupo</h6>
                <button type="button" class="btn btn-sm btn-outline-danger btn-remover-grupo">Remover Grupo</button>
            </div>
            <div class="row g-3">
                <div class="col-md-12"><label class="form-label small">Nome do Grupo (Ex: Escolha sua Torta)</label><input type="text" class="form-control form-control-sm nome-grupo-kit" required></div>
                <div class="col-md-6">
                    <label class="form-label small">Tipo de Seleção</label>
                    <select class="form-select form-select-sm tipo-selecao-grupo-kit" required>
                        <option value="ESCOLHA_UNICA">Escolha Única (cliente seleciona 1 item)</option>
                        <option value="QUANTIDADE_TOTAL">Quantidade Total (cliente distribui uma quantidade)</option>
                    </select>
                </div>
                <div class="col-md-6"><label class="form-label small">Quantidade Máxima (para tipo 'Quantidade Total')</label><input type="number" class="form-control form-control-sm qtde-max-grupo-kit" value="1" min="1"></div>
            </div>
            <hr>
            <label class="form-label small fw-bold">Opções/Sabores para este Grupo:</label>
            <div class="lista-opcoes-kit mb-2"></div>
            <button type="button" class="btn btn-sm btn-outline-success btn-add-opcao-kit"><i class="bi bi-plus"></i> Adicionar Opção</button>
        `;
        listaGruposKit.appendChild(divGrupo);
        divGrupo.querySelector('.btn-remover-grupo').addEventListener('click', function () { this.closest('.grupo-kit-bloco').remove(); });
        divGrupo.querySelector('.btn-add-opcao-kit').addEventListener('click', function () { adicionarLinhaOpcaoKit(this.previousElementSibling); });
    }

    function adicionarLinhaOpcaoKit(containerOpcoes) {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'row g-2 mb-2 align-items-center opcao-kit-bloco';

        let optionsHTML = '<option value="">Selecione um produto...</option>';
        todosOsProdutos.forEach(p => {
            optionsHTML += `<option value="${p.id}">${p.nome}</option>`;
        });

        divOpcao.innerHTML = `
            <div class="col-10">
                <select class="form-select form-select-sm produto-id-opcao-kit" required>${optionsHTML}</select>
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-sm btn-danger w-100 btn-remover-opcao"><i class="bi bi-trash"></i></button>
            </div>`;
        containerOpcoes.appendChild(divOpcao);
        divOpcao.querySelector('.btn-remover-opcao').addEventListener('click', function () { this.closest('.opcao-kit-bloco').remove(); });
    }

    // --- Submissão do Formulário ---
    formProduto.addEventListener('submit', function (e) {
        e.preventDefault();

        const receita = [];
        // (Lógica de recolha de receita aqui, se necessário)

        const gruposKit = [];
        if (isKitCheckbox.checked) {
            document.querySelectorAll('.grupo-kit-bloco').forEach(blocoGrupo => {
                const nomeGrupo = blocoGrupo.querySelector('.nome-grupo-kit').value;
                const tipoSelecao = blocoGrupo.querySelector('.tipo-selecao-grupo-kit').value;
                const quantidadeMaxima = parseInt(blocoGrupo.querySelector('.qtde-max-grupo-kit').value);
                const opcoes = [];
                blocoGrupo.querySelectorAll('.opcao-kit-bloco').forEach(blocoOpcao => {
                    const produtoId = blocoOpcao.querySelector('.produto-id-opcao-kit').value;
                    if (produtoId) {
                        opcoes.push({ produto: { id: parseInt(produtoId) } });
                    }
                });
                if (nomeGrupo && tipoSelecao && opcoes.length > 0) {
                    gruposKit.push({ nome: nomeGrupo, tipoSelecao, quantidadeMaxima, opcoes });
                }
            });
        }

        const produto = {
            nome: document.getElementById('nome').value,
            preco: parseFloat(document.getElementById('preco').value),
            qtdeMax: parseInt(document.getElementById('qtdeMax').value),
            categoria: document.getElementById('categoria').value,
            codPdv: document.getElementById('codigoPdv').value ? document.getElementById('codigoPdv').value : null,
            descricao: document.getElementById('descricao').value,
            ordemVisualizacao: document.getElementById('ordemVisualizacao').value ? parseInt(document.getElementById('ordemVisualizacao').value) : 0,
            imagem: document.getElementById('imagem').value,
            ativo: true,
            isMateriaPrima: isMateriaPrimaCheckbox.checked,
            isComplemento: document.getElementById('isComplemento').checked,
            permiteComplementos: permiteComplementosCheckbox.checked,
            isKit: isKitCheckbox.checked,
            vendidoIndividualmente: document.getElementById('vendidoIndividualmente').checked,
            receita: receita,
            gruposKit: gruposKit,
            complementosDisponiveis: []
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
            listaReceita.innerHTML = '';
            containerReceita.style.display = 'block';
            listaGruposKit.innerHTML = '';
            containerKit.style.display = 'none';
            document.getElementById('vendidoIndividualmente').checked = true;
        })
        .catch(error => {
            Swal.fire('Erro!', `Erro ao cadastrar produto: ${error.message}`, 'error');
        });
    });

    carregarProdutosParaSelecao();
});