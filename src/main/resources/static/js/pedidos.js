// static/js/pedidos.js
let todosProdutos = []; // Cache global de todos os produtos da API.
let cart = {};          // Objeto que armazena o carrinho de compras.

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi';
const CART_STORAGE_KEY = 'pedAiCart';

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

// --- FUNÇÕES DE UI ---
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

// --- LÓGICA DE CARREGAMENTO E RENDERIZAÇÃO DE PRODUTOS ---
async function carregarEProcessarProdutosAPI() {
    showLoadingIndicator(true);
    try {
        const response = await fetch('/api/produtos');
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        // Garante que o ID seja sempre uma string para comparações seguras
        todosProdutos = (await response.json()).map(p => ({...p, id: String(p.id)}));
        console.log("--- TODOS OS PRODUTOS PROCESSADOS (pedidos.js) ---", todosProdutos);
        
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

    const produtosParaCategorias = todosProdutos.filter(p => !p.isComplemento && !p.isMateriaPrima && p.ativo);
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

function filtrarEExibirProdutosCardapio(categoriaSelecionada) {
    const produtosParaCardapio = todosProdutos.filter(p => p.ativo && !p.isComplemento && !p.isMateriaPrima);
    let produtosFiltrados = produtosParaCardapio;
    if (categoriaSelecionada !== 'todos') {
        produtosFiltrados = produtosParaCardapio.filter(p => p.categoria === categoriaSelecionada);
    }
    produtosFiltrados.sort((a, b) => (a.ordemVisualizacao ?? Infinity) - (b.ordemVisualizacao ?? Infinity) || (a.nome || '').localeCompare(b.nome || ''));
    renderizarCardsProdutos(produtosFiltrados);
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
                <div class="card-img-top-wrapper"><img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome}"></div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome}</h5>
                    <p class="card-text descricao small text-muted">${produto.descricao || ''}</p>
                    <p class="preco fw-bold fs-5 mt-auto mb-2">R$ ${(produto.preco || 0).toFixed(2)}</p>
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

function abrirModalMontagemKit(produtoKit) {
    const modalElement = document.getElementById('kitModal');
    if (!modalElement) return;
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
        
        // =================== INÍCIO DA CORREÇÃO 1 (undefined) ===================
        grupo.opcoes.forEach(opcao => {
            // A informação do produto pode vir só com o ID.
            const produtoIdDaOpcao = String(typeof opcao.produto === 'object' ? opcao.produto.id : opcao.produto);

            // Buscamos o produto completo na nossa lista principal 'todosProdutos'
            const produtoOpcaoCompleto = todosProdutos.find(p => p.id === produtoIdDaOpcao);

            if (produtoOpcaoCompleto) {
                optionsContainer.appendChild(criarInputOpcao(produtoOpcaoCompleto, grupo, index));
            } else {
                console.error(`Produto da opção com ID ${produtoIdDaOpcao} não encontrado.`);
            }
        });
        // =================== FIM DA CORREÇÃO 1 =================================
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
    div.className = 'kit-option-item';

    if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="radio" name="group-${groupIndex}" id="option-${produtoOpcao.id}" value="${produtoOpcao.id}">
            <label class="form-check-label" for="option-${produtoOpcao.id}">${produtoOpcao.nome}</label>
        `;
    } else { // QUANTIDADE_TOTAL
        div.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        // =================== INÍCIO DA CORREÇÃO 2 (campo de quantidade) ===================
        div.innerHTML = `
            <span>${produtoOpcao.nome}</span>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="decrease">-</button>
                <input type="number" class="form-control form-control-sm mx-1 kit-qty-input" data-group-index="${groupIndex}" data-prod-id="${produtoOpcao.id}" value="0" min="0" max="${grupo.quantidadeMaxima}" style="width: 55px; text-align: center;">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="increase">+</button>
            </div>
        `;
        // =================== FIM DA CORREÇÃO 2 =========================================

        const input = div.querySelector('input');
        div.querySelectorAll('.kit-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let currentValue = parseInt(input.value);
                if (btn.dataset.action === 'increase') {
                    input.value = currentValue + 1;
                } else if (btn.dataset.action === 'decrease' && currentValue > 0) {
                    input.value = currentValue - 1;
                }
                input.dispatchEvent(new Event('input'));
            });
        });
        
        input.addEventListener('input', () => {
            let totalNoGrupo = 0;
            document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(i => {
                totalNoGrupo += parseInt(i.value) || 0;
            });

            if (totalNoGrupo > grupo.quantidadeMaxima) {
                input.value = parseInt(input.value) - (totalNoGrupo - grupo.quantidadeMaxima);
            }
            atualizarContadorGrupo(groupIndex, grupo.quantidadeMaxima);
        });
    }
    return div;
}

function atualizarContadorGrupo(groupIndex, max) {
    let total = 0;
    document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(input => {
        total += parseInt(input.value) || 0;
    });

    const counterElement = document.getElementById(`group-counter-${groupIndex}`);
    if (!counterElement) return;
    counterElement.textContent = `${total} / ${max}`;

    counterElement.classList.remove('text-danger', 'text-success');
    if (total > max) {
        counterElement.classList.add('text-danger');
    } else if (total === max) {
        counterElement.classList.add('text-success');
    }
}

function coletarEscolhasDoKit(produtoKit) {
    const dados = {};
    let valido = true;

    produtoKit.gruposKit.forEach((grupo, index) => {
        if (!valido) return;
        if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
            const checkedRadio = document.querySelector(`input[name="group-${index}"]:checked`);
            if (!checkedRadio) {
                Swal.fire('Atenção', `Você precisa selecionar uma opção para o grupo "${grupo.nome}".`, 'warning');
                valido = false;
                return;
            }
            dados[grupo.nome] = [{ produtoId: checkedRadio.value, quantidade: 1 }];
        } else {
            const opcoesDoGrupo = [];
            let totalQtde = 0;
            document.querySelectorAll(`input[data-group-index="${index}"]`).forEach(input => {
                const qtde = parseInt(input.value) || 0;
                if (qtde > 0) {
                    opcoesDoGrupo.push({ produtoId: input.dataset.prodId, quantidade: qtde });
                }
                totalQtde += qtde;
            });
            if (totalQtde !== grupo.quantidadeMaxima) {
                Swal.fire('Atenção', `A soma das quantidades para "${grupo.nome}" deve ser exatamente ${grupo.quantidadeMaxima}.`, 'warning');
                valido = false;
            }
            dados[grupo.nome] = opcoesDoGrupo;
        }
    });

    return { valido, dados };
}

function adicionarKitAoCarrinho(produtoKit, escolhas) {
    const cartId = `kit-${produtoKit.id}-${Date.now()}`;
    cart[cartId] = {
        ...produtoKit,
        qtde: 1,
        type: 'kit',
        escolhas: escolhas
    };
    showProdutoAdicionadoToast(produtoKit);
    saveCartToStorage();
}

window.onload = () => {
    cart = getCartFromStorage();
    updateCartCountNavbar();
    carregarEProcessarProdutosAPI();
};