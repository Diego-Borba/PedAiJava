document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    if (!formProduto) return;

    // --- Referências aos Elementos ---
    const isKitCheckbox = document.getElementById('isKit');
    const containerKit = document.getElementById('containerKit');
    const btnAddGrupoKit = document.getElementById('btnAddGrupoKit');
    const listaGruposKit = document.getElementById('listaGruposKit');

    // --- NOVAS REFERÊNCIAS PARA RECEITA ---
    const btnAddReceita = document.getElementById('btnAddReceita');
    const listaReceitaContainer = document.getElementById('listaReceita');
    
    const imagemFileInput = document.getElementById('imagemFile');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    let imagemParaUpload = null; 
    
    let todosOsProdutos = [];

    async function carregarProdutosParaSelecao() {
        try {
            const response = await fetch('/api/produtos');
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            todosOsProdutos = await response.json();
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível carregar a lista de produtos para as opções de kit/receita.', 'error');
        }
    }

    // Lógica de Preview da Imagem (sem alterações)
    imagemFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagemParaUpload = { base64: e.target.result, tipo: file.type };
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagemParaUpload = null;
            previewContainer.style.display = 'none';
            if (file) {
                Swal.fire('Formato Inválido', 'Selecione JPG ou PNG.', 'warning');
                imagemFileInput.value = '';
            }
        }
    });

    // --- Lógica de UI (Kit e Receita) ---
    isKitCheckbox.addEventListener('change', function () {
        containerKit.style.display = this.checked ? 'block' : 'none';
        if (this.checked && listaGruposKit.children.length === 0) {
            adicionarLinhaGrupoKit();
        }
    });
    
    btnAddGrupoKit?.addEventListener('click', () => adicionarLinhaGrupoKit());
    
    // --- NOVA LÓGICA PARA ADICIONAR INGREDIENTE ---
    btnAddReceita?.addEventListener('click', () => adicionarLinhaIngrediente());

    function adicionarLinhaGrupoKit() {
        // (Função sem alterações)
        const divGrupo = document.createElement('div');
        divGrupo.className = 'p-3 border rounded mb-3 bg-white shadow-sm grupo-kit-bloco';
        divGrupo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2"><h6 class="mb-0">Novo Grupo</h6><button type="button" class="btn btn-sm btn-outline-danger btn-remover-grupo">Remover Grupo</button></div>
            <div class="row g-3">
                <div class="col-md-12"><label class="form-label small">Nome do Grupo</label><input type="text" class="form-control form-control-sm nome-grupo-kit" required placeholder="Ex: Escolha sua Bebida"></div>
                <div class="col-md-6"><label class="form-label small">Tipo de Seleção</label><select class="form-select form-select-sm tipo-selecao-grupo-kit" required><option value="ESCOLHA_UNICA">Escolha Única</option><option value="QUANTIDADE_TOTAL">Quantidade Total</option></select></div>
                <div class="col-md-6"><label class="form-label small">Quantidade Máxima</label><input type="number" class="form-control form-control-sm qtde-max-grupo-kit" value="1" min="1"></div>
            </div><hr><label class="form-label small fw-bold">Opções para este Grupo:</label><div class="lista-opcoes-kit mb-2"></div><button type="button" class="btn btn-sm btn-outline-success btn-add-opcao-kit"><i class="bi bi-plus"></i> Adicionar Opção</button>`;
        listaGruposKit.appendChild(divGrupo);
        divGrupo.querySelector('.btn-remover-grupo').addEventListener('click', function () { this.closest('.grupo-kit-bloco').remove(); });
        divGrupo.querySelector('.btn-add-opcao-kit').addEventListener('click', function () { adicionarLinhaOpcaoKit(this.previousElementSibling); });
        adicionarLinhaOpcaoKit(divGrupo.querySelector('.lista-opcoes-kit'));
    }

    function adicionarLinhaOpcaoKit(containerOpcoes) {
        // (Função sem alterações)
        const divOpcao = document.createElement('div');
        divOpcao.className = 'row g-2 mb-2 align-items-center opcao-kit-bloco';
        let optionsHTML = '<option value="">Selecione um produto...</option>';
        todosOsProdutos.forEach(p => { optionsHTML += `<option value="${p.id}">${p.nome}</option>`; });
        divOpcao.innerHTML = `<div class="col-10"><select class="form-select form-select-sm produto-id-opcao-kit" required>${optionsHTML}</select></div><div class="col-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-opcao"><i class="bi bi-trash"></i></button></div>`;
        containerOpcoes.appendChild(divOpcao);
        divOpcao.querySelector('.btn-remover-opcao').addEventListener('click', function () { this.closest('.opcao-kit-bloco').remove(); });
    }

    // --- NOVA FUNÇÃO PARA CRIAR LINHA DE INGREDIENTE ---
    function adicionarLinhaIngrediente() {
        const div = document.createElement('div');
        div.className = 'row g-3 mb-3 pb-3 border-bottom ingrediente-bloco';
        div.innerHTML = `
            <div class="col-md-7">
                <label class="form-label small">Ingrediente (Matéria-Prima)</label>
                <select class="form-select form-select-sm select-ingrediente" required></select>
            </div>
            <div class="col-md-4">
                <label class="form-label small">Qtde. Utilizada</label>
                <input type="number" step="0.001" class="form-control form-control-sm qtde-ingrediente" required placeholder="Ex: 0.250 para 250g">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm w-100 btn-remover-ingrediente"><i class="bi bi-trash"></i></button>
            </div>
        `;
        listaReceitaContainer.appendChild(div);
        
        // Inicializa o Select2 para busca de produtos
        $(div.querySelector('.select-ingrediente')).select2({
            theme: 'bootstrap-5',
            placeholder: 'Busque por uma matéria-prima',
            ajax: {
                url: '/api/produtos/search', // Usa o mesmo endpoint de busca geral
                dataType: 'json',
                delay: 250,
                data: (params) => ({ q: params.term }),
                processResults: (data) => ({ results: data }),
            }
        });
        
        div.querySelector('.btn-remover-ingrediente').addEventListener('click', function() {
            this.closest('.ingrediente-bloco').remove();
        });
    }

    // --- Submissão do Formulário (ATUALIZADA) ---
    formProduto.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Coleta de dados do Kit (sem alterações)
        const gruposKit = [];
        if (document.getElementById('isKit').checked) {
            document.querySelectorAll('.grupo-kit-bloco').forEach(blocoGrupo => {
                const nomeGrupo = blocoGrupo.querySelector('.nome-grupo-kit').value;
                const tipoSelecao = blocoGrupo.querySelector('.tipo-selecao-grupo-kit').value;
                const quantidadeMaxima = parseInt(blocoGrupo.querySelector('.qtde-max-grupo-kit').value);
                const opcoes = [];
                blocoGrupo.querySelectorAll('.opcao-kit-bloco').forEach(blocoOpcao => {
                    const produtoId = blocoOpcao.querySelector('.produto-id-opcao-kit').value;
                    if (produtoId) { opcoes.push({ produto: { id: parseInt(produtoId) } }); }
                });
                if (nomeGrupo && tipoSelecao && opcoes.length > 0) {
                    gruposKit.push({ nome: nomeGrupo, tipoSelecao, quantidadeMaxima, opcoes });
                }
            });
        }
        
        // --- NOVA LÓGICA PARA COLETAR DADOS DA RECEITA ---
        const receita = [];
        document.querySelectorAll('.ingrediente-bloco').forEach(bloco => {
            const ingredienteId = bloco.querySelector('.select-ingrediente').value;
            const quantidade = parseFloat(bloco.querySelector('.qtde-ingrediente').value);
            
            if (ingredienteId && quantidade > 0) {
                receita.push({
                    produtoIngredienteId: parseInt(ingredienteId),
                    quantidadeUtilizada: quantidade
                });
            }
        });

        // Montagem do objeto produto final para envio
        const produto = {
            nome: document.getElementById('nome').value,
            preco: parseFloat(document.getElementById('preco').value) || 0,
            categoria: document.getElementById('categoria').value,
            codPdv: document.getElementById('codigoPdv').value || null,
            descricao: document.getElementById('descricao').value,
            ordemVisualizacao: document.getElementById('ordemVisualizacao').value ? parseInt(document.getElementById('ordemVisualizacao').value) : 0,
            isMateriaPrima: document.getElementById('isMateriaPrima').checked,
            isComplemento: document.getElementById('isComplemento').checked,
            permiteComplementos: document.getElementById('permiteComplementos').checked,
            isKit: document.getElementById('isKit').checked,
            vendidoIndividualmente: document.getElementById('vendidoIndividualmente').checked,
            gruposKit: gruposKit,
            receita: receita // Adiciona a receita ao payload
        };

        try {
            // Lógica de envio para o backend (sem alterações)
            const responseProduto = await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });

            if (!responseProduto.ok) {
                const errorText = await responseProduto.text();
                throw new Error(errorText || `Erro ${responseProduto.status}`);
            }

            const produtoCriado = await responseProduto.json();
            const produtoId = produtoCriado.id;

            if (imagemParaUpload) {
                const responseImagem = await fetch(`/api/produtos/${produtoId}/imagem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imagemBase64: imagemParaUpload.base64, imagemTipo: imagemParaUpload.tipo })
                });
                 if (!responseImagem.ok) { throw new Error('Produto salvo, mas falha ao enviar imagem.'); }
            }

            Swal.fire({
                icon: 'success', title: 'Sucesso!', text: `Produto "${produtoCriado.nome}" cadastrado!`,
                timer: 2000, showConfirmButton: false
            }).then(() => {
                formProduto.reset();
                previewContainer.style.display = 'none';
                imagePreview.src = '#';
                imagemParaUpload = null;
                listaGruposKit.innerHTML = '';
                containerKit.style.display = 'none';
                listaReceitaContainer.innerHTML = ''; // Limpa a lista de receita
                window.scrollTo(0, 0);
            });

        } catch (error) {
            Swal.fire('Erro!', `Erro ao cadastrar produto: ${error.message}`, 'error');
        }
    });

    carregarProdutosParaSelecao();
});