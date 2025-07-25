let todosProdutos = []; // Cache global de todos os produtos da API, processados e normalizados.
let cart = {};          // Objeto que armazena o carrinho de compras em memória nesta página.

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi'; // Imagem padrão.
const CART_STORAGE_KEY = 'pedAiCart'; // Chave para o carrinho no localStorage.

// --- GERENCIAMENTO DO CARRINHO (LOCALSTORAGE) ---
function getCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    try {
        const parsedCart = JSON.parse(storedCart);
        return typeof parsedCart === 'object' && parsedCart !== null ? parsedCart : {};
    } catch (e) {
        console.error("Erro ao parsear carrinho do localStorage (pedidos.js):", e);
        return {};
    }
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCountNavbar();
}

// --- UI HELPERS ---
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = show ? 'block' : 'none';
}

function updateCartCountNavbar() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) {
        console.warn("Elemento 'cartCountNavbar' não encontrado em pedidos.js.");
        return;
    }
    let totalItensPrincipaisNoCarrinho = 0;
    Object.values(cart).forEach(itemPrincipal => {
        if (itemPrincipal && typeof itemPrincipal.qtde === 'number') {
            totalItensPrincipaisNoCarrinho += itemPrincipal.qtde;
        }
    });
    cartCountEl.innerText = totalItensPrincipaisNoCarrinho;
}

function showProdutoAdicionadoToast(produto, isComplemento = false) {
    const title = isComplemento ? `${produto.nome} (complemento) adicionado!` : `${produto.nome} adicionado!`;
    Swal.fire({
        title: title,
        html: `<div class="text-center"><img src="${produto.imagem || PLACEHOLDER_IMAGE}" alt="${produto.nome}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; border: 2px solid #ff5722;"><p class="mb-0">Adicionado ao seu carrinho.</p></div>`,
        icon: 'success', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000, timerProgressBar: true, showCloseButton: true
    });
}

// --- CARREGAMENTO E PROCESSAMENTO DE PRODUTOS ---
async function carregarEProcessarProdutosAPI() {
    showLoadingIndicator(true);
    try {
        const response = await axios.get('/api/produtos'); // Alterado para buscar todos
        todosProdutos = response.data.map(p => ({ ...p, id: String(p.id) }));

        console.log("--- TODOS OS PRODUTOS PROCESSADOS (pedidos.js) ---", todosProdutos);
        
        await carregarCategoriasVisiveis();
        filtrarEExibirProdutosCardapio('todos');
    } catch (err) {
        console.error('Erro fatal ao carregar/processar produtos da API (pedidos.js):', err);
        const container = document.getElementById('produtosContainer');
        if (container) container.innerHTML = '<p class="text-danger text-center col-12">Falha ao carregar produtos. Tente recarregar a página.</p>';
    } finally {
        showLoadingIndicator(false);
    }
}

async function carregarCategoriasVisiveis() {
    const container = document.getElementById('categoryButtons');
    if (!container) { console.warn("Elemento 'categoryButtons' não encontrado em pedidos.js."); return; }
    container.innerHTML = '';

    try {
        const produtosParaCategorias = todosProdutos.filter(p => !p.isComplemento && !p.isMateriaPrima && p.ativo);
        const categoriasUnicas = [...new Set(produtosParaCategorias.map(p => p.categoria).filter(cat => cat && String(cat).trim() !== ""))];
        categoriasUnicas.sort((a, b) => String(a).localeCompare(String(b)));

        const todosBtn = document.createElement('button');
        todosBtn.className = 'btn btn-outline-primary active me-2 mb-2';
        todosBtn.textContent = 'Todos';
        todosBtn.onclick = () => {
            document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
            todosBtn.classList.add('active');
            filtrarEExibirProdutosCardapio('todos');
        };
        container.appendChild(todosBtn);

        categoriasUnicas.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary me-2 mb-2';
            btn.textContent = cat;
            btn.onclick = () => {
                document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filtrarEExibirProdutosCardapio(cat);
            };
            container.appendChild(btn);
        });
    } catch (err) {
        console.error('Erro ao carregar categorias (pedidos.js):', err);
        if (container) container.innerHTML = '<p class="text-warning col-12">Erro ao carregar filtros de categoria.</p>';
    }
}

function filtrarEExibirProdutosCardapio(categoriaSelecionada) {
    showLoadingIndicator(true);
    
    setTimeout(() => {
        const produtosParaCardapio = todosProdutos.filter(p => p.ativo && !p.isComplemento && !p.isMateriaPrima);

        let produtosFiltrados = produtosParaCardapio;
        if (categoriaSelecionada !== 'todos') {
            produtosFiltrados = produtosParaCardapio.filter(p => p.categoria && String(p.categoria).toLowerCase() === String(categoriaSelecionada).toLowerCase());
        }
        
        produtosFiltrados.sort((a, b) => (a.ordemVisualizacao ?? Infinity) - (b.ordemVisualizacao ?? Infinity) || (a.nome || '').localeCompare(b.nome || ''));

        renderizarCardsProdutos(produtosFiltrados);
        showLoadingIndicator(false);
    }, 50);
}

function renderizarCardsProdutos(listaDeProdutosCardapio) {
    const container = document.getElementById('produtosContainer');
    if (!container) { console.error("Container 'produtosContainer' não encontrado em pedidos.js."); return; }
    container.innerHTML = '';

    if (listaDeProdutosCardapio.length === 0) {
        container.innerHTML = '<p class="text-center col-12 mt-5">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    listaDeProdutosCardapio.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex align-items-stretch';
        card.innerHTML = `
            <div class="card produto-card h-100 shadow-sm">
                <div class="card-img-top-wrapper"><img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome || 'Produto'}"></div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome || 'Produto Sem Nome'}</h5>
                    <p class="card-text descricao small text-muted">${produto.descricao || 'Sem descrição disponível.'}</p>
                    <p class="preco fw-bold fs-5 mt-auto mb-2">R$ ${(produto.preco != null ? produto.preco : 0).toFixed(2)}</p>
                    <button class="btn btn-add-carrinho w-100"><i class="bi bi-cart-plus me-2"></i>Adicionar</button>
                </div>
            </div>`;
        card.querySelector('.btn-add-carrinho').addEventListener('click', () => handleProdutoClick(produto));
        container.appendChild(card);
    });
}


function handleProdutoClick(produto) {
    if (produto.isKit) {
        abrirModalMontagemKit(produto);
    }
    else if (produto.permiteComplementos && produto.complementosDisponiveis && produto.complementosDisponiveis.length > 0) {
        handleProdutoPrincipalClick(produto);
    }
    else {
        adicionarProdutoSimplesAoCarrinho(produto);
    }
}

function adicionarProdutoSimplesAoCarrinho(produto) {
    const cartId = `prod-${produto.id}`;
    if (cart[cartId]) {
        if (cart[cartId].qtde >= (produto.qtdeMax || 99)) {
            Swal.fire('Limite Atingido!', `Quantidade máxima para "${produto.nome}" já atingida no carrinho.`, 'warning');
            return;
        }
        cart[cartId].qtde++;
    } else {
        cart[cartId] = {
            ...produto,
            qtde: 1,
            type: 'simple',
            selectedComplements: []
        };
    }
    showProdutoAdicionadoToast(produto);
    saveCartToStorage();
}

function handleProdutoPrincipalClick(produtoPrincipal) {
    const produtoPrincipalIdStr = String(produtoPrincipal.id);
    const cartId = `prod-${produtoPrincipalIdStr}`;

    if (cart[cartId]) {
        if (cart[cartId].qtde >= (produtoPrincipal.qtdeMax || 99)) {
            Swal.fire('Limite Atingido!', `Quantidade máxima para "${produtoPrincipal.nome}" já atingida.`, 'warning');
            return;
        }
        cart[cartId].qtde++;
    } else {
        cart[cartId] = {
            ...produtoPrincipal,
            qtde: 1,
            type: 'simple_with_complements',
            selectedComplements: []
        };
    }
    showProdutoAdicionadoToast(produtoPrincipal);

    if (produtoPrincipal.permiteComplementos && Array.isArray(produtoPrincipal.complementosDisponiveis) && produtoPrincipal.complementosDisponiveis.length > 0) {
        prepararEMostrarModalComplementos(produtoPrincipal);
    } else {
        saveCartToStorage();
    }
}

function prepararEMostrarModalComplementos(produtoPrincipal) {
    const produtoPrincipalIdStr = String(produtoPrincipal.id);
    const cartId = `prod-${produtoPrincipalIdStr}`;

    const modalElement = document.getElementById('complementosModal');
    const principalProductNameModal = document.getElementById('principalProductNameModal');
    const complementosListContainer = document.getElementById('complementosListContainer');
    const btnSalvarComplementos = document.getElementById('btnSalvarComplementos');

    if (!modalElement || !principalProductNameModal || !complementosListContainer || !btnSalvarComplementos) {
        saveCartToStorage();
        return;
    }

    principalProductNameModal.textContent = produtoPrincipal.nome;
    complementosListContainer.innerHTML = '';

    const itemPrincipalNoCarrinho = cart[cartId];
    const complementosJaSelecionados = (itemPrincipalNoCarrinho && Array.isArray(itemPrincipalNoCarrinho.selectedComplements)) ? itemPrincipalNoCarrinho.selectedComplements : [];

    produtoPrincipal.complementosDisponiveis.forEach(configComp => {
        const idComplementoConfigStr = String(configComp.complementoProdutoId);
        const produtoComplementoDetalhes = todosProdutos.find(p => p.id === idComplementoConfigStr && p.ativo);

        if (produtoComplementoDetalhes) {
            const inputId = `comp-qty-${produtoPrincipalIdStr}-${produtoComplementoDetalhes.id}`;
            let qtdAtualNoModal = complementosJaSelecionados.find(cs => String(cs.produto.id) === idComplementoConfigStr)?.qtde || 0;
            const maxPermitido = configComp.maxQtdePermitida;

            const divCompItem = document.createElement('div');
            divCompItem.className = 'complemento-item d-flex justify-content-between align-items-center mb-3 p-3 border rounded shadow-sm bg-light';
            divCompItem.innerHTML = `
                <div class="me-3"><img src="${produtoComplementoDetalhes.imagem || PLACEHOLDER_IMAGE}" alt="${produtoComplementoDetalhes.nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.25rem;"></div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${produtoComplementoDetalhes.nome}</h6>
                    <small class="text-muted">R$ ${(produtoComplementoDetalhes.preco || 0).toFixed(2)}</small>
                    <small class="d-block text-primary fw-bold">Máximo permitido: ${maxPermitido}</small>
                </div>
                <div class="d-flex align-items-center">
                    <button type="button" class="btn btn-sm btn-outline-secondary comp-qty-change" data-action="decrease" data-target-input-id="${inputId}">-</button>
                    <input type="number" id="${inputId}" class="form-control form-control-sm mx-2 comp-qty-input" value="${qtdAtualNoModal}" min="0" data-complement-id="${idComplementoConfigStr}" data-max-qty="${maxPermitido}" style="width: 70px; text-align: center;" readonly>
                    <button type="button" class="btn btn-sm btn-outline-secondary comp-qty-change" data-action="increase" data-target-input-id="${inputId}">+</button>
                </div>`;
            complementosListContainer.appendChild(divCompItem);
        }
    });

    complementosListContainer.querySelectorAll('.comp-qty-change').forEach(button => {
        button.addEventListener('click', function() {
            ajustarQtdeComplementoModal(this.dataset.targetInputId, this.dataset.action === 'increase' ? 1 : -1);
        });
    });

    const novoBtnSalvar = btnSalvarComplementos.cloneNode(true);
    btnSalvarComplementos.parentNode.replaceChild(novoBtnSalvar, btnSalvarComplementos);
    novoBtnSalvar.addEventListener('click', () => salvarComplementosDoModal(produtoPrincipalIdStr));

    const bootstrapModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}

function ajustarQtdeComplementoModal(inputId, delta) {
    const inputElement = document.getElementById(inputId);
    if (!inputElement) return;
    const maxQtde = parseInt(inputElement.dataset.maxQty);
    let newValue = parseInt(inputElement.value) + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > maxQtde) newValue = maxQtde;
    inputElement.value = newValue;
}

function salvarComplementosDoModal(idProdutoPrincipalStr) {
    const cartId = `prod-${idProdutoPrincipalStr}`;
    const itemPrincipalNoCarrinho = cart[cartId];
    if (!itemPrincipalNoCarrinho) {
        Swal.fire('Erro!', 'Produto principal não encontrado no carrinho.', 'error');
        return;
    }

    const novosSelectedComplements = [];
    document.querySelectorAll('#complementosListContainer .comp-qty-input').forEach(input => {
        const quantidade = parseInt(input.value);
        if (quantidade > 0) {
            const idComplementoStr = String(input.dataset.complementId);
            const produtoComplementoDetalhes = todosProdutos.find(p => p.id === idComplementoStr);
            if (produtoComplementoDetalhes) {
                novosSelectedComplements.push({
                    produto: { id: produtoComplementoDetalhes.id, nome: produtoComplementoDetalhes.nome, preco: produtoComplementoDetalhes.preco, imagem: produtoComplementoDetalhes.imagem },
                    qtde: quantidade
                });
            }
        }
    });
    itemPrincipalNoCarrinho.selectedComplements = novosSelectedComplements;

    saveCartToStorage();

    const modalElement = document.getElementById('complementosModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
    if (bootstrapModal) bootstrapModal.hide();
    
    Swal.fire('Complementos Salvos!', `Os complementos para "${itemPrincipalNoCarrinho.nome}" foram atualizados.`, 'success');
}

function abrirModalMontagemKit(produtoKit) {
    const modalElement = document.getElementById('kitModal');
    const modal = new bootstrap.Modal(modalElement);
    document.getElementById('kitProductNameModal').textContent = produtoKit.nome;
    const groupsContainer = document.getElementById('kitGroupsContainer');
    groupsContainer.innerHTML = '';
    produtoKit.gruposKit.forEach((grupo, index) => {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'p-3 border rounded mb-3 bg-light';
        grupoDiv.innerHTML = `
            <h5>${grupo.nome}</h5>
            <p class="text-muted small">${grupo.tipoSelecao === 'ESCOLHA_UNICA' ? 'Escolha 1 opção.' : `Escolha exatamente ${grupo.quantidadeMaxima} itens.`}</p>
            <div id="group-options-${index}"></div>
            ${grupo.tipoSelecao === 'QUANTIDADE_TOTAL' ? `<div class="text-end fw-bold mt-2" id="group-counter-${index}">0 / ${grupo.quantidadeMaxima}</div>` : ''}
        `;
        groupsContainer.appendChild(grupoDiv);
        const optionsContainer = document.getElementById(`group-options-${index}`);
        grupo.opcoes.forEach(opcao => {
            const produtoOpcao = todosProdutos.find(p => p.id === opcao.produto.id);
            if (produtoOpcao) {
                optionsContainer.appendChild(criarInputOpcao(produtoOpcao, grupo, index));
            }
        });
    });
    const btnConfirmar = document.getElementById('btnConfirmarKit');
    const novoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);
    novoBtn.addEventListener('click', () => {
        const escolhas = coletarEscolhasDoKit(produtoKit);
        if(escolhas.valido) {
            adicionarKitAoCarrinho(produtoKit, escolhas.dados);
            modal.hide();
        }
    });
    modal.show();
}
function criarInputOpcao(produtoOpcao, grupo, groupIndex) {
    const div = document.createElement('div');
    if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
        div.className = 'form-check mb-2';
        div.innerHTML = `
            <input class="form-check-input" type="radio" name="group-${groupIndex}" id="option-${produtoOpcao.id}" value="${produtoOpcao.id}">
            <label class="form-check-label" for="option-${produtoOpcao.id}">${produtoOpcao.nome}</label>
        `;
    } else {
        div.className = 'd-flex justify-content-between align-items-center mb-2';
        div.innerHTML = `
            <label for="option-qty-${produtoOpcao.id}">${produtoOpcao.nome}</label>
            <input type="number" id="option-qty-${produtoOpcao.id}" class="form-control" data-group-index="${groupIndex}" data-prod-id="${produtoOpcao.id}" value="0" min="0" max="${grupo.quantidadeMaxima}" style="width: 80px;">
        `;
        const input = div.querySelector('input');
        input.addEventListener('input', () => atualizarContadorGrupo(groupIndex, grupo.quantidadeMaxima));
    }
    return div;
}
function atualizarContadorGrupo(groupIndex, max) {
    let total = 0;
    document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(input => { total += parseInt(input.value) || 0; });
    const counterElement = document.getElementById(`group-counter-${groupIndex}`);
    counterElement.textContent = `${total} / ${max}`;
    if (total > max) { counterElement.classList.add('text-danger'); counterElement.classList.remove('text-success'); }
    else if (total === max) { counterElement.classList.remove('text-danger'); counterElement.classList.add('text-success'); }
    else { counterElement.classList.remove('text-danger', 'text-success'); }
}
function coletarEscolhasDoKit(produtoKit) {
    const dados = {};
    let valido = true;
    produtoKit.gruposKit.forEach((grupo, index) => {
        if (!valido) return;
        if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
            const checkedRadio = document.querySelector(`input[name="group-${index}"]:checked`);
            if (!checkedRadio) { Swal.fire('Atenção', `Você precisa selecionar uma opção para o grupo "${grupo.nome}".`, 'warning'); valido = false; return; }
            dados[grupo.nome] = [{ produtoId: checkedRadio.value, quantidade: 1 }];
        } else {
            const opcoesDoGrupo = [];
            let totalQtde = 0;
            document.querySelectorAll(`input[data-group-index="${index}"]`).forEach(input => {
                const qtde = parseInt(input.value);
                if (qtde > 0) { opcoesDoGrupo.push({ produtoId: input.dataset.prodId, quantidade: qtde }); }
                totalQtde += qtde;
            });
            if (totalQtde !== grupo.quantidadeMaxima) { Swal.fire('Atenção', `A soma das quantidades para o grupo "${grupo.nome}" deve ser exatamente ${grupo.quantidadeMaxima}. Você selecionou ${totalQtde}.`, 'warning'); valido = false; return; }
            if (opcoesDoGrupo.length === 0) { Swal.fire('Atenção', `Você precisa escolher os itens para o grupo "${grupo.nome}".`, 'warning'); valido = false; return; }
            dados[grupo.nome] = opcoesDoGrupo;
        }
    });
    return { valido, dados };
}
function adicionarKitAoCarrinho(produtoKit, escolhas) {
    const cartId = `kit-${produtoKit.id}-${Date.now()}`;
    cart[cartId] = {
        id: produtoKit.id,
        nome: produtoKit.nome,
        preco: produtoKit.preco,
        imagem: produtoKit.imagem,
        qtde: 1,
        type: 'kit',
        escolhas: escolhas
    };
    Swal.fire('Kit Adicionado!', `"${produtoKit.nome}" foi montado e adicionado ao carrinho.`, 'success');
    saveCartToStorage();
}

window.onload = () => {
    cart = getCartFromStorage();
    updateCartCountNavbar();
    carregarEProcessarProdutosAPI();
};
