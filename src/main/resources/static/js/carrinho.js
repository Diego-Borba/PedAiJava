// static/js/carrinho.js
const CART_STORAGE_KEY_CARRINHO = 'pedAiCart';
const CUSTOMER_STORAGE_KEY_CARRINHO = 'pedAiCustomer';
const PLACEHOLDER_IMAGE_CARRINHO = 'https://via.placeholder.com/150x150.png?text=PedAi';

let cartData = {};
let loggedInCustomerData = null;
let todosProdutosGlobaisParaCarrinho = [];

// --- GERENCIAMENTO DO LOCALSTORAGE ---
function getCartFromStorageCarrinho() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY_CARRINHO);
    try {
        const parsed = JSON.parse(storedCart);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
        console.error("Erro ao parsear carrinho (carrinho.js):", e);
        return {};
    }
}

function saveCartToStorageCarrinho() {
    localStorage.setItem(CART_STORAGE_KEY_CARRINHO, JSON.stringify(cartData));
    console.log("[SAVE_CART] Carrinho salvo (carrinho.js), chamando atualização da UI...");
    displayCartItems();
    updateCartCountNavbarCarrinho();
}

function getCustomerFromStorageCarrinho() { const s = localStorage.getItem(CUSTOMER_STORAGE_KEY_CARRINHO); try { const p = JSON.parse(s); return typeof p === 'object' && p !== null ? p : null; } catch (e) { return null; } }
function saveCustomerToStorageCarrinho(c) { localStorage.setItem(CUSTOMER_STORAGE_KEY_CARRINHO, JSON.stringify(c)); }
function removeCustomerFromStorageCarrinho() { localStorage.removeItem(CUSTOMER_STORAGE_KEY_CARRINHO); }

// --- CARREGAR PRODUTOS GLOBAIS ---
async function carregarTodosProdutosParaReferenciaCarrinho() {
    try {
        const response = await fetch('/api/produtos');
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        const data = await response.json();
        todosProdutosGlobaisParaCarrinho = data.map(p => ({
            ...p,
            id: String(p.id)
            // Outras normalizações que você já tinha podem ser mantidas aqui
        }));
        console.log("Produtos globais carregados (carrinho.js):", todosProdutosGlobaisParaCarrinho);
    } catch (error) {
        console.error("Falha ao carregar produtos globais (carrinho.js):", error);
    }
}

// --- UI DO CARRINHO ---
function updateCartCountNavbarCarrinho() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) return;
    let totalItens = Object.values(cartData).reduce((total, item) => total + (item.qtde || 0), 0);
    cartCountEl.innerText = totalItens;
}

function displayCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const checkoutSection = document.getElementById('checkoutSection');
    if (!container || !emptyCartMessage || !checkoutSection) return;

    container.innerHTML = '';
    const idsProdutosNoCarrinho = Object.keys(cartData);

    if (idsProdutosNoCarrinho.length === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutSection.style.display = 'none';
        updateCartSummary(0);
        return;
    }

    emptyCartMessage.style.display = 'none';
    checkoutSection.style.display = 'block';

    let totalGeralCompra = 0;

    idsProdutosNoCarrinho.forEach(cartId => {
        const itemPrincipal = cartData[cartId];
        if (!itemPrincipal) return;

        // Calcula o subtotal apenas do item principal (seja simples, com complemento ou kit)
        const subtotalItem = (itemPrincipal.preco || 0) * itemPrincipal.qtde;
        totalGeralCompra += subtotalItem;
        
        // Adiciona o preço dos complementos simples ao total geral
        if (Array.isArray(itemPrincipal.selectedComplements)) {
            itemPrincipal.selectedComplements.forEach(comp => {
                totalGeralCompra += (comp.produto.preco || 0) * comp.qtde;
            });
        }


        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row mb-3 p-3 border rounded bg-white shadow-sm';

        // =================== INÍCIO DA MODIFICAÇÃO ===================
        let detalhesHtml = '';

        // **NOVA LÓGICA**: Verifica se o item é um KIT e renderiza as escolhas
        if (itemPrincipal.type === 'kit' && itemPrincipal.escolhas) {
            detalhesHtml += '<div class="ms-md-4 mt-2 ps-md-2 border-start">';
            for (const nomeGrupo in itemPrincipal.escolhas) {
                detalhesHtml += `<small class="d-block fw-bold text-muted">${nomeGrupo}:</small><ul class="list-unstyled ms-3 mb-2">`;
                itemPrincipal.escolhas[nomeGrupo].forEach(opcao => {
                    const produtoOpcao = todosProdutosGlobaisParaCarrinho.find(p => p.id == opcao.produtoId);
                    const nomeOpcao = produtoOpcao ? produtoOpcao.nome : `Produto ID ${opcao.produtoId}`;
                    detalhesHtml += `<li class="small text-secondary"><i class="bi bi-arrow-right-short"></i> ${opcao.quantidade}x ${nomeOpcao}</li>`;
                });
                detalhesHtml += '</ul>';
            }
            detalhesHtml += '</div>';
        }
        // **LÓGICA ANTIGA MANTIDA**: Renderiza complementos simples (se existirem)
        else if (Array.isArray(itemPrincipal.selectedComplements) && itemPrincipal.selectedComplements.length > 0) {
            detalhesHtml += '<div class="ms-md-4 mt-2 ps-md-2">';
            itemPrincipal.selectedComplements.forEach(compItem => {
                 if (!compItem || !compItem.produto) return;
                const complemento = compItem.produto;
                const subtotalComplemento = (complemento.preco || 0) * compItem.qtde;

                detalhesHtml += `
                    <div class="cart-complement-item d-flex align-items-center mb-2 py-1">
                        <div class="flex-grow-1">
                            <small class="fw-semibold d-block text-muted">+ ${complemento.nome}</small>
                        </div>
                        <div class="text-end" style="min-width:80px;">
                            <small class="cart-item-subtotal d-block">+ R$ ${subtotalComplemento.toFixed(2)}</small>
                        </div>
                    </div>`;
            });
            detalhesHtml += '</div>';
        }
        // =================== FIM DA MODIFICAÇÃO ===================


        itemRow.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${itemPrincipal.imagem || PLACEHOLDER_IMAGE_CARRINHO}" alt="${itemPrincipal.nome || 'Produto'}" class="cart-item-img">
                <div class="flex-grow-1 cart-item-details ms-3">
                    <h5 class="mb-1">${itemPrincipal.nome || 'Produto Indisponível'}</h5>
                    <p class="text-muted mb-1 small">Unit.: R$ ${(itemPrincipal.preco || 0).toFixed(2)}</p>
                    <div class="d-flex align-items-center cart-item-actions mt-1">
                        <button class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="handleChangeQuantity('${cartId}', ${itemPrincipal.qtde - 1})">-</button>
                        <input type="number" class="form-control form-control-sm mx-2" value="${itemPrincipal.qtde}" readonly style="width:60px; text-align:center;">
                        <button class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="handleChangeQuantity('${cartId}', ${itemPrincipal.qtde + 1})">+</button>
                    </div>
                </div>
                <div class="text-end ms-3">
                    <p class="mb-1 cart-item-subtotal fw-bold">R$ ${subtotalItem.toFixed(2)}</p>
                    <button class="btn btn-sm btn-danger mt-1" onclick="handleRemoveItem('${cartId}')" title="Remover item"><i class="bi bi-trash3"></i></button>
                </div>
            </div>
            ${detalhesHtml}  `;
        container.appendChild(itemRow);
    });

    updateCartSummary(totalGeralCompra);
    updateFinalizeButtonState();
}


function updateCartSummary(totalGeral) {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;
    summaryContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold" style="font-size: 1.1rem;">
                Total do Pedido:
                <span class="total-value" style="color: #ff5722;">R$ ${totalGeral.toFixed(2)}</span>
            </li>
        </ul>`;
}

// --- MANIPULAÇÃO DO CARRINHO (Suas funções existentes, sem alterações) ---
function handleChangeQuantity(cartId, newQuantity) {
    const itemPrincipal = cartData[cartId];
    if (!itemPrincipal) return;
    if (newQuantity <= 0) {
        handleRemoveItem(cartId);
        return;
    }
    itemPrincipal.qtde = newQuantity;
    saveCartToStorageCarrinho();
}

function handleRemoveItem(cartId) {
    const itemRemovido = cartData[cartId];
    if (!itemRemovido) return;
    delete cartData[cartId];
    Swal.fire('Removido!', `"${itemRemovido.nome}" foi removido do carrinho.`, 'success');
    saveCartToStorageCarrinho();
}
// (Suas outras funções de manipulação de complementos, etc, permanecem aqui)


// --- LÓGICA DE CLIENTE E FINALIZAÇÃO ---
// (Suas funções de UI de cliente (updateCustomerUI, handleRegister, handleLogin, etc) permanecem as mesmas)
// ...

async function finalizeOrder() {
    // Validações iniciais (carrinho vazio, cliente logado, etc) permanecem as mesmas
    if (Object.keys(cartData).length === 0) { Swal.fire('Carrinho Vazio!', 'Adicione itens ao seu carrinho.', 'warning'); return; }
    if (!loggedInCustomerData) { Swal.fire('Identifique-se!', 'Por favor, entre na sua conta ou cadastre-se.', 'info'); return; }
    if (!loggedInCustomerData.endereco || !loggedInCustomerData.endereco.cep) { Swal.fire('Endereço Incompleto!', 'Verifique seu cadastro.', 'warning'); return; }

    const formaPagamentoSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
    if (!formaPagamentoSelecionada) { Swal.fire('Atenção!', 'Selecione uma forma de pagamento.', 'warning'); return; }

    const pedidoItensPayload = [];

    // =================== INÍCIO DA MODIFICAÇÃO ===================
    for (const cartId in cartData) {
        const item = cartData[cartId];

        // Adiciona o produto principal (seja simples ou kit) ao pedido
        pedidoItensPayload.push({
            produtoId: parseInt(item.id),
            quantidade: item.qtde,
            precoUnitario: item.preco
        });

        // **NOVA LÓGICA**: Se for um kit, adiciona suas opções escolhidas ao payload também
        // Isso é crucial para a baixa de estoque dos "sabores"
        if (item.type === 'kit' && item.escolhas) {
            for (const nomeGrupo in item.escolhas) {
                item.escolhas[nomeGrupo].forEach(opcao => {
                    pedidoItensPayload.push({
                        produtoId: parseInt(opcao.produtoId),
                        // Multiplica a qtde da opção pela qtde de kits pedidos
                        quantidade: opcao.quantidade * item.qtde,
                        // O preço unitário aqui é 0, pois o valor já está no preço do Kit principal.
                        precoUnitario: 0
                    });
                });
            }
        }
        // **LÓGICA ANTIGA MANTIDA**: Adiciona complementos simples ao payload
        else if (Array.isArray(item.selectedComplements)) {
            item.selectedComplements.forEach(compItem => {
                if (compItem && compItem.produto) {
                    pedidoItensPayload.push({
                        produtoId: parseInt(compItem.produto.id),
                        quantidade: compItem.qtde * item.qtde,
                        precoUnitario: compItem.produto.preco
                    });
                }
            });
        }
    }
    // =================== FIM DA MODIFICAÇÃO ===================

    const payload = {
        clienteId: loggedInCustomerData.id,
        enderecoEntrega: loggedInCustomerData.endereco,
        itens: pedidoItensPayload,
        formaPagamento: formaPagamentoSelecionada.value,
    };

    // (O resto da sua função de finalização (chamada fetch, etc) permanece o mesmo)
    Swal.fire({ title: 'Confirmando seu pedido...', text: 'Aguarde.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const response = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` })); throw new Error(errorData.message || 'Erro ao registrar pedido.'); }
        const data = await response.json();
        Swal.fire('Pedido Enviado!', `Seu pedido nº ${data.id} foi registrado!`, 'success').then(() => { cartData = {}; saveCartToStorageCarrinho(); window.location.href = 'meus-pedidos.html'; });
    } catch (err) { Swal.fire('Ops!', `Não foi possível registrar seu pedido: ${err.message}`, 'error'); }
}


// --- INICIALIZAÇÃO DA PÁGINA DO CARRINHO ---
window.onload = async () => {
    cartData = getCartFromStorageCarrinho();
    loggedInCustomerData = getCustomerFromStorageCarrinho();

    await carregarTodosProdutosParaReferenciaCarrinho();

    updateCartCountNavbarCarrinho();
    displayCartItems();
    updateCustomerUI();

    // (Sua lógica de inicialização de listeners de botões (login, etc) permanece a mesma)
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const registerBtn = document.getElementById('registerButton');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const finalizeBtn = document.getElementById('finalizeOrderButton');
    if (finalizeBtn) finalizeBtn.addEventListener('click', finalizeOrder);
};