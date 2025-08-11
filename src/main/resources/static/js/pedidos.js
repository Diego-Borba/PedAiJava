// static/js/pedidos.js 
let todosProdutos = [];
let cart = {};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi';
const CART_STORAGE_KEY = 'pedAiCart';

// --- CARRINHO (LocalStorage) ---
function getCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    try {
        const parsedCart = JSON.parse(storedCart);
        return typeof parsedCart === 'object' && parsedCart !== null ? parsedCart : {};
    } catch (e) {
        console.error("Erro ao parsear carrinho:", e);
        return {};
    }
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCountNavbar();
}

// --- UI ---
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = show ? 'block' : 'none';
}

function updateCartCountNavbar() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) return;
    let totalItens = Object.values(cart).reduce((total, item) => total + (item.qtde || 0), 0);
    cartCountEl.innerText = totalItens;
}

function showProdutoAdicionadoToast(produto) {
    Swal.fire({
        title: `${produto.nome} adicionado!`,
        icon: 'success', toast: true, position: 'bottom-end',
        showConfirmButton: false, timer: 2000, timerProgressBar: true
    });
}

// --- PRODUTOS ---
async function carregarEProcessarProdutosAPI() {
    showLoadingIndicator(true);
    try {
        const response = await fetch('/api/produtos/cardapio');
        if (!response.ok) throw new Error('Falha ao carregar produtos');
<<<<<<< HEAD
        
        // A variável `todosProdutos` agora contém TODOS os produtos relevantes (graças à correção no backend).
        todosProdutos = (await response.json()).map(p => ({...p, id: String(p.id)}));

=======
        todosProdutos = (await response.json()).map(p => ({ ...p, id: String(p.id) }));
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
        await carregarCategoriasVisiveis();
        filtrarEExibirProdutosCardapio('todos');
    } catch (err) {
        console.error('Erro fatal ao carregar produtos:', err);
    } finally {
        showLoadingIndicator(false);
    }
}

async function carregarCategoriasVisiveis() {
    const container = document.getElementById('categoryButtons');
    if (!container) return;
    container.innerHTML = '';

    // Os botões de categoria são gerados com base nos produtos que são vendidos individualmente.
    const produtosParaCategorias = todosProdutos.filter(p => p.vendidoIndividualmente);
    const categoriasUnicas = [...new Set(produtosParaCategorias.map(p => p.categoria).filter(Boolean))];
    categoriasUnicas.sort();

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
}

/**
 * LÓGICA DE EXIBIÇÃO CORRETA:
 * Esta função pega a lista COMPLETA de produtos e a filtra APENAS para
 * a renderização dos cards na vitrine principal.
 * A variável `todosProdutos` permanece intacta para ser usada na montagem dos kits.
 */
function filtrarEExibirProdutosCardapio(categoriaSelecionada) {
<<<<<<< HEAD
    // Começa com a lista completa para garantir que a montagem de kits funcione.
    let produtosParaExibir = todosProdutos;

    // FILTRO 1: Mostra nos cards apenas os produtos marcados como 'vendidoIndividualmente'.
    produtosParaExibir = produtosParaExibir.filter(p => p.vendidoIndividualmente);

    // FILTRO 2: Filtra por categoria, se uma for selecionada.
=======
    const produtosParaCardapio = todosProdutos.filter(p => p.ativo);

    let produtosFiltrados = produtosParaCardapio;
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
    if (categoriaSelecionada !== 'todos') {
        produtosParaExibir = produtosParaExibir.filter(p => p.categoria === categoriaSelecionada);
    }
<<<<<<< HEAD
    
    produtosParaExibir.sort((a, b) => (a.ordemVisualizacao ?? Infinity) - (b.ordemVisualizacao ?? Infinity) || (a.nome || '').localeCompare(b.nome || ''));

    // Renderiza os cards apenas com a lista filtrada para exibição.
    renderizarCardsProdutos(produtosParaExibir);
=======

    produtosFiltrados.sort((a, b) =>
        (a.ordemVisualizacao ?? Infinity) - (b.ordemVisualizacao ?? Infinity) ||
        (a.nome || '').localeCompare(b.nome || '')
    );

    renderizarCardsProdutos(produtosFiltrados);
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
}

function renderizarCardsProdutos(listaDeProdutos) {
    const container = document.getElementById('produtosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (listaDeProdutos.length === 0) {
        container.innerHTML = '<p class="text-center col-12 mt-5">Nenhum produto encontrado.</p>';
        return;
    }

    listaDeProdutos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex align-items-stretch';
        card.innerHTML = `
            <div class="card produto-card h-100 shadow-sm">
                <div class="card-img-top-wrapper">
                    <img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome || 'Nome Indefinido'}</h5>
                    <p class="card-text descricao small text-muted">${produto.descricao || ''}</p>
                    <p class="preco fw-bold fs-5 mt-auto mb-2">R$ ${(produto.preco || 0).toFixed(2)}</p>
                    <button class="btn btn-add-carrinho w-100">
                        <i class="bi bi-cart-plus me-2"></i>Adicionar
                    </button>
                </div>
            </div>`;
        card.querySelector('.btn-add-carrinho').addEventListener('click', () => handleProdutoClick(produto));
        container.appendChild(card);
    });
}

function handleProdutoClick(produto) {
    if (produto.isKit) {
        abrirModalMontagemKit(produto);
    } else {
        adicionarProdutoSimplesAoCarrinho(produto);
    }
}

function adicionarProdutoSimplesAoCarrinho(produto) {
    const cartId = `prod-${produto.id}`;
    if (cart[cartId]) {
        cart[cartId].qtde++;
    } else {
        cart[cartId] = { ...produto, qtde: 1, type: 'simple' };
    }
    showProdutoAdicionadoToast(produto);
    saveCartToStorage();
}

/**
 * MONTAGEM DO KIT CORRETA:
 * Esta função usa a lista `todosProdutos` (que agora está completa) para encontrar
 * as opções do kit, resolvendo o erro.
 */
function abrirModalMontagemKit(produtoKit) {
    const modalElement = document.getElementById('kitModal');
    if (!modalElement) return;
    const modal = new bootstrap.Modal(modalElement);

    console.log("Produto Kit recebido:", produtoKit);

    document.getElementById('kitProductNameModal').textContent = produtoKit.nome;
    const groupsContainer = document.getElementById('kitGroupsContainer');
    groupsContainer.innerHTML = '';

    produtoKit.gruposKit.forEach((grupo, index) => {
        console.log(`Grupo [${grupo.nome}]`, grupo);

        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'p-3 border rounded mb-3 bg-light';
        grupoDiv.innerHTML = `
            <h5>${grupo.nome.toUpperCase()}</h5>
            <p class="text-muted small">
                ${grupo.tipoSelecao === 'ESCOLHA_UNICA'
                ? 'Escolha 1 opção.'
                : `Escolha exatamente ${grupo.quantidadeMaxima} itens.`}
            </p>
            <div id="group-options-${index}" class="row g-2"></div>
            ${grupo.tipoSelecao === 'QUANTIDADE_TOTAL'
                ? `<div class="text-end fw-bold mt-2" id="group-counter-${index}">0 / ${grupo.quantidadeMaxima}</div>`
                : ''}
        `;
        groupsContainer.appendChild(grupoDiv);

        const optionsContainer = document.getElementById(`group-options-${index}`);
<<<<<<< HEAD

        grupo.opcoes.forEach(opcao => {
            const produtoIdDaOpcao = String(typeof opcao.produto === 'object' ? opcao.produto.id : opcao.produto);
            const produtoOpcaoCompleto = todosProdutos.find(p => p.id === produtoIdDaOpcao);
=======

        grupo.opcoes.forEach(opcao => {
            let produtoOpcao = null;

            if (opcao.produto && typeof opcao.produto === 'object') {
                produtoOpcao = {
                    id: String(opcao.produto.id),
                    nome: opcao.produto.nome,
                    ativo: opcao.produto.ativo
                };
            } else if (opcao.produto) {
                produtoOpcao = todosProdutos.find(p => String(p.id) === String(opcao.produto)) || null;
            }
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8

            if (produtoOpcao && produtoOpcao.ativo !== false) {
                optionsContainer.appendChild(criarInputOpcao(produtoOpcao, grupo, index));
            } else {
<<<<<<< HEAD
                console.error(`Produto da opção com ID ${produtoIdDaOpcao} não encontrado na lista de produtos carregada.`);
=======
                console.warn(`Produto não encontrado ou inativo:`, opcao);
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
            }
        });
    });

    const btnConfirmar = document.getElementById('btnConfirmarKit');
    const novoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);
    novoBtn.addEventListener('click', () => {
        const escolhas = coletarEscolhasDoKit(produtoKit);
        if (escolhas.valido) {
            adicionarKitAoCarrinho(produtoKit, escolhas.dados);
            modal.hide();
        }
    });

    modal.show();
}

function criarInputOpcao(produtoOpcao, grupo, groupIndex) {
    const col = document.createElement('div');
    // ✨ ALTERAÇÃO AQUI ✨
    // Removemos 'col-md-6' para que o elemento sempre ocupe a largura total.
    col.className = 'col-12'; 

    if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
<<<<<<< HEAD
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="radio" name="group-${groupIndex}" id="option-${produtoOpcao.id}" value="${produtoOpcao.id}">
            <label class="form-check-label" for="option-${produtoOpcao.id}">${produtoOpcao.nome}</label>
        `;
    } else { // QUANTIDADE_TOTAL
        div.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        div.innerHTML = `
            <span>${produtoOpcao.nome}</span>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="decrease">-</button>
                <input type="number" class="form-control form-control-sm mx-1 kit-qty-input" data-group-index="${groupIndex}" data-prod-id="${produtoOpcao.id}" value="0" min="0" max="${grupo.quantidadeMaxima}" style="width: 55px; text-align: center;">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="increase">+</button>
            </div>
        `;
=======
        col.innerHTML = `
            <div class="form-check border rounded p-2">
                <input class="form-check-input" type="radio" 
                    name="group-${groupIndex}" 
                    id="option-${produtoOpcao.id}" 
                    value="${produtoOpcao.id}">
                <label class="form-check-label" for="option-${produtoOpcao.id}">
                    ${produtoOpcao.nome}
                </label>
            </div>`;
    } else {
        col.innerHTML = `
            <div class="border rounded p-2 d-flex justify-content-between align-items-center">
                <span>${produtoOpcao.nome}</span>
                <div class="d-flex align-items-center">
                    <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="decrease">-</button>
                    <input type="number" class="form-control form-control-sm mx-1 kit-qty-input" 
                        data-group-index="${groupIndex}" 
                        data-prod-id="${produtoOpcao.id}" 
                        value="0" min="0" max="${grupo.quantidadeMaxima}" style="width: 50px; text-align: center;">
                    <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="increase">+</button>
                </div>
            </div>`;
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8

        const input = col.querySelector('input');
        col.querySelectorAll('.kit-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let val = parseInt(input.value) || 0;
                if (btn.dataset.action === 'increase' && val < grupo.quantidadeMaxima) input.value = val + 1;
                else if (btn.dataset.action === 'decrease' && val > 0) input.value = val - 1;
                input.dispatchEvent(new Event('input'));
            });
        });
<<<<<<< HEAD

        input.addEventListener('input', () => {
            let totalNoGrupo = 0;
            document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(i => {
                totalNoGrupo += parseInt(i.value) || 0;
            });
=======
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8

        input.addEventListener('input', () => {
            let totalGrupo = 0;
            document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(i => totalGrupo += parseInt(i.value) || 0);
            if (totalGrupo > grupo.quantidadeMaxima) input.value = parseInt(input.value) - (totalGrupo - grupo.quantidadeMaxima);
            atualizarContadorGrupo(groupIndex, grupo.quantidadeMaxima);
        });
    }
    return col;
}

function atualizarContadorGrupo(groupIndex, max) {
    let total = 0;
    document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(input => total += parseInt(input.value) || 0);
    const counterElement = document.getElementById(`group-counter-${groupIndex}`);
    if (!counterElement) return;
    counterElement.textContent = `${total} / ${max}`;
    counterElement.classList.remove('text-danger', 'text-success');
    if (total > max) counterElement.classList.add('text-danger');
    else if (total === max) counterElement.classList.add('text-success');
}

function coletarEscolhasDoKit(produtoKit) {
    const dados = {};
    let valido = true;

    produtoKit.gruposKit.forEach((grupo, index) => {
        if (!valido) return;
        if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
            const checked = document.querySelector(`input[name="group-${index}"]:checked`);
            if (!checked) {
                Swal.fire('Atenção', `Selecione uma opção para "${grupo.nome}".`, 'warning');
                valido = false;
                return;
            }
            dados[grupo.nome] = [{ produtoId: checked.value, quantidade: 1 }];
        } else {
            const opcoes = [];
            let total = 0;
            document.querySelectorAll(`input[data-group-index="${index}"]`).forEach(input => {
                const qtde = parseInt(input.value) || 0;
                if (qtde > 0) opcoes.push({ produtoId: input.dataset.prodId, quantidade: qtde });
                total += qtde;
            });
            if (total !== grupo.quantidadeMaxima) {
                Swal.fire('Atenção', `A soma das quantidades para "${grupo.nome}" deve ser ${grupo.quantidadeMaxima}.`, 'warning');
                valido = false;
            }
            dados[grupo.nome] = opcoes;
        }
    });

    return { valido, dados };
}

function adicionarKitAoCarrinho(produtoKit, escolhas) {
    const cartId = `kit-${produtoKit.id}-${Date.now()}`;
    cart[cartId] = { ...produtoKit, qtde: 1, type: 'kit', escolhas };
    showProdutoAdicionadoToast(produtoKit);
    saveCartToStorage();
}

// --- INIT ---
window.onload = () => {
    cart = getCartFromStorage();
    updateCartCountNavbar();
    carregarEProcessarProdutosAPI();
};