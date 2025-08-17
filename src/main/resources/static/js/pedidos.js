// src/main/resources/static/js/pedidos.js
let todosProdutos = [];
let cart = {};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/250x250.png?text=PedAi';
const CART_STORAGE_KEY = 'pedAiCart';

// --- GERENCIAMENTO DO CARRINHO ---
function getCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    try {
        const parsedCart = JSON.parse(storedCart);
        return typeof parsedCart === 'object' && parsedCart !== null ? parsedCart : {};
    } catch (e) {
        console.error("Erro ao ler carrinho do localStorage:", e);
        return {};
    }
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCountNavbar();
}

// --- INTERFACE DO USUÁRIO (UI) ---
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = show ? 'flex' : 'none';
}

function updateCartCountNavbar() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) return;
    const totalItens = Object.values(cart).reduce((total, item) => total + (item.qtde || 0), 0);
    cartCountEl.innerText = totalItens;
}

function showProdutoAdicionadoToast(produto) {
    Swal.fire({
        title: `${produto.nome} adicionado!`,
        icon: 'success',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });
}

// --- LÓGICA DE PRODUTOS E API ---
async function carregarEProcessarProdutosAPI() {
    showLoadingIndicator(true);
    try {
        const response = await fetch('/api/produtos/cardapio');
        if (!response.ok) {
            throw new Error('Falha ao carregar produtos do servidor.');
        }
        todosProdutos = await response.json();
        
        await carregarCategoriasVisiveis();
        filtrarEExibirProdutosCardapio('todos');

    } catch (err) {
        console.error('Erro fatal ao carregar produtos:', err);
        const container = document.getElementById('produtosContainer');
        if(container) container.innerHTML = `<p class="text-center col-12 mt-5 text-danger">Oops! Não foi possível carregar o cardápio. Tente novamente mais tarde.</p>`;
    } finally {
        showLoadingIndicator(false);
    }
}

async function carregarCategoriasVisiveis() {
    const container = document.getElementById('categoryButtons');
    if (!container) return;
    container.innerHTML = '';

    const produtosParaCategorias = todosProdutos.filter(p => p.vendidoIndividualmente);
    const categoriasUnicas = [...new Set(produtosParaCategorias.map(p => p.categoria).filter(Boolean))];
    categoriasUnicas.sort();

    const todosBtn = document.createElement('button');
    todosBtn.className = 'btn active';
    todosBtn.textContent = 'Todos';
    todosBtn.onclick = () => {
        document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
        todosBtn.classList.add('active');
        filtrarEExibirProdutosCardapio('todos');
    };
    container.appendChild(todosBtn);

    categoriasUnicas.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'btn';
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
    let produtosParaExibir = todosProdutos.filter(p => p.vendidoIndividualmente);

    if (categoriaSelecionada !== 'todos') {
        produtosParaExibir = produtosParaExibir.filter(p => p.categoria === categoriaSelecionada);
    }
    
    produtosParaExibir.sort((a, b) => (a.ordemVisualizacao ?? 999) - (b.ordemVisualizacao ?? 999) || (a.nome || '').localeCompare(b.nome || ''));
    renderizarCardsProdutos(produtosParaExibir);
}

function renderizarCardsProdutos(listaDeProdutos) {
    const container = document.getElementById('produtosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (listaDeProdutos.length === 0) {
        container.innerHTML = '<p class="text-center col-12 mt-5">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    listaDeProdutos.forEach(produto => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4';
        cardWrapper.innerHTML = `
            <div class="produto-card h-100">
                <div class="card-img-top-wrapper">
                    <img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome || ''}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome || 'Nome Indefinido'}</h5>
                    <p class="card-text descricao flex-grow-1">${produto.descricao || ''}</p>
                    <p class="preco">R$ ${(produto.preco || 0).toFixed(2).replace('.', ',')}</p>
                    <button class="btn btn-add-carrinho w-100 mt-auto">
                        <i class="bi bi-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>`;
        cardWrapper.querySelector('.btn-add-carrinho').addEventListener('click', () => handleProdutoClick(produto));
        container.appendChild(cardWrapper);
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
    if (!modalElement) {
        console.error('Elemento do modal #kitModal não encontrado!');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    document.getElementById('kitProductNameModal').textContent = produtoKit.nome;
    const groupsContainer = document.getElementById('kitGroupsContainer');
    groupsContainer.innerHTML = ''; 

    if (produtoKit.gruposKit && produtoKit.gruposKit.length > 0) {
        produtoKit.gruposKit.forEach((grupo, index) => {
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'p-3 border rounded mb-3';
            grupoDiv.innerHTML = `
                <h5>${grupo.nome.toUpperCase()}</h5>
                <p class="text-muted small">${grupo.tipoSelecao === 'ESCOLHA_UNICA' ? 'Escolha 1 opção.' : `Escolha exatamente ${grupo.quantidadeMaxima} itens.`}</p>
                <div id="group-options-${index}" class="list-group"></div>
                ${grupo.tipoSelecao === 'QUANTIDADE_TOTAL' ? `<div class="text-end fw-bold mt-2" id="group-counter-${index}">0 / ${grupo.quantidadeMaxima}</div>` : ''}
            `;
            groupsContainer.appendChild(grupoDiv);

            const optionsContainer = document.getElementById(`group-options-${index}`);
            if (grupo.opcoes) {
                grupo.opcoes.forEach(opcao => {
                    if (opcao.produto) {
                        optionsContainer.appendChild(criarInputOpcao(opcao.produto, grupo, index));
                    }
                });
            }
        });
    }

    const btnConfirmar = document.getElementById('btnConfirmarKit');
    const novoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);
    novoBtn.addEventListener('click', () => {
        const escolhas = coletarEscolhasDoKit(produtoKit);
        if (escolhas.valido) {
            adicionarKitAoCarrinho(produtoKit, escolhas.dados);
            modal.hide();
        }
    }, { once: true });

    modal.show();
}


function criarInputOpcao(produtoOpcao, grupo, groupIndex) {
    const div = document.createElement('div');
    if (grupo.tipoSelecao === 'ESCOLHA_UNICA') {
        div.className = 'kit-option-item form-check';
        div.innerHTML = `
            <input class="form-check-input" type="radio" name="group-${groupIndex}" id="option-${produtoOpcao.id}" value="${produtoOpcao.id}" required>
            <label class="form-check-label w-100" for="option-${produtoOpcao.id}">${produtoOpcao.nome}</label>
        `;
    } else { // QUANTIDADE_TOTAL
        div.className = 'kit-option-item d-flex justify-content-between align-items-center';
        div.innerHTML = `
            <span>${produtoOpcao.nome}</span>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="decrease">-</button>
                <input type="number" class="form-control form-control-sm text-center mx-1 kit-qty-input" data-group-index="${groupIndex}" data-prod-id="${produtoOpcao.id}" value="0" min="0" max="${grupo.quantidadeMaxima}" style="width: 55px;">
                <button type="button" class="btn btn-outline-secondary btn-sm kit-qty-btn" data-action="increase">+</button>
            </div>
        `;
        const input = div.querySelector('.kit-qty-input');

        // Listener para os botões de + e -
        div.querySelectorAll('.kit-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let val = parseInt(input.value) || 0;
                if (btn.dataset.action === 'increase') {
                    let totalGrupo = 0;
                    document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(i => totalGrupo += parseInt(i.value) || 0);
                    if (totalGrupo < grupo.quantidadeMaxima) input.value = val + 1;
                } else if (btn.dataset.action === 'decrease' && val > 0) {
                    input.value = val - 1;
                }
                atualizarContadorGrupo(groupIndex, grupo.quantidadeMaxima);
            });
        });

        // --- NOVA LÓGICA ---
        // Listener para quando o usuário digita no campo
        input.addEventListener('input', () => {
            let valorDigitado = parseInt(input.value) || 0;

            if (valorDigitado < 0) { // Garante que não seja negativo
                valorDigitado = 0;
            }

            // Calcula o total dos OUTROS campos no mesmo grupo
            let totalOutrosCampos = 0;
            document.querySelectorAll(`input[data-group-index="${groupIndex}"]`).forEach(outroInput => {
                if (outroInput !== input) {
                    totalOutrosCampos += parseInt(outroInput.value) || 0;
                }
            });

            // Calcula o valor máximo que este campo pode assumir
            const maxPermitidoParaEsteCampo = grupo.quantidadeMaxima - totalOutrosCampos;

            if (valorDigitado > maxPermitidoParaEsteCampo) {
                valorDigitado = maxPermitidoParaEsteCampo;
            }
            
            input.value = valorDigitado; // Atualiza o campo com o valor corrigido

            atualizarContadorGrupo(groupIndex, grupo.quantidadeMaxima);
        });
    }
    return div;
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
            } else {
                dados[grupo.nome] = [{ produtoId: checked.value, quantidade: 1 }];
            }
        } else { // QUANTIDADE_TOTAL
            const opcoes = [];
            let total = 0;
            document.querySelectorAll(`input[data-group-index="${index}"]`).forEach(input => {
                const qtde = parseInt(input.value) || 0;
                if (qtde > 0) opcoes.push({ produtoId: input.dataset.prodId, quantidade: qtde });
                total += qtde;
            });
            if (total !== grupo.quantidadeMaxima) {
                Swal.fire('Atenção', `A soma das quantidades para "${grupo.nome}" deve ser exatamente ${grupo.quantidadeMaxima}. Você selecionou ${total}.`, 'warning');
                valido = false;
            } else if (opcoes.length === 0) {
                Swal.fire('Atenção', `Você deve escolher os itens para "${grupo.nome}".`, 'warning');
                valido = false;
            }
            else {
                dados[grupo.nome] = opcoes;
            }
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

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    cart = getCartFromStorage();
    updateCartCountNavbar();
    carregarEProcessarProdutosAPI();
});