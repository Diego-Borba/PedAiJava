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
        return {};
    }
}

function saveCartToStorageCarrinho() {
    localStorage.setItem(CART_STORAGE_KEY_CARRINHO, JSON.stringify(cartData));
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
        todosProdutosGlobaisParaCarrinho = (await response.json()).map(p => ({ ...p, id: String(p.id) }));
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

        const subtotalItem = (itemPrincipal.preco || 0) * itemPrincipal.qtde;
        totalGeralCompra += subtotalItem;
        
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row mb-3 p-3 border rounded bg-white shadow-sm';

        let detalhesHtml = '';
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

function handleChangeQuantity(cartId, newQuantity) {
    if (newQuantity <= 0) {
        handleRemoveItem(cartId);
        return;
    }
    cartData[cartId].qtde = newQuantity;
    saveCartToStorageCarrinho();
}

function handleRemoveItem(cartId) {
    const itemRemovido = cartData[cartId];
    delete cartData[cartId];
    Swal.fire('Removido!', `"${itemRemovido.nome}" foi removido do carrinho.`, 'success');
    saveCartToStorageCarrinho();
}

function updateCustomerUI() {
    const loggedInDiv = document.getElementById('loggedInCustomer');
    const guestDiv = document.getElementById('guestCustomer');
    const customerNameSpan = document.getElementById('customerName');
    const customerDetailsDiv = document.getElementById('customerDetails');

    if (loggedInCustomerData) {
        loggedInDiv.style.display = 'flex';
        guestDiv.style.display = 'none';
        customerNameSpan.textContent = loggedInCustomerData.nome;
        if (loggedInCustomerData.endereco) {
            customerDetailsDiv.style.display = 'block';
            customerDetailsDiv.innerHTML = `
                <i class="bi bi-truck"></i> Entregar em: 
                ${loggedInCustomerData.endereco.logradouro || ''}, 
                ${loggedInCustomerData.endereco.numero || ''} - 
                ${loggedInCustomerData.endereco.bairro || ''}`;
        }
    } else {
        loggedInDiv.style.display = 'none';
        guestDiv.style.display = 'block';
    }
    updateFinalizeButtonState();
}

function updateFinalizeButtonState() {
    const finalizeBtn = document.getElementById('finalizeOrderButton');
    if (!finalizeBtn) return;
    const isCartEmpty = Object.keys(cartData).length === 0;
    const isCustomerLoggedIn = !!loggedInCustomerData;
    finalizeBtn.disabled = isCartEmpty || !isCustomerLoggedIn;
}

async function handleRegister() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Cadastro Rápido',
        html: `
            <input id="swal-nome" class="swal2-input" placeholder="Nome Completo" required>
            <input id="swal-email" type="email" class="swal2-input" placeholder="E-mail" required>
            <input id="swal-senha" type="password" class="swal2-input" placeholder="Senha" required>
            <input id="swal-telefone" type="tel" class="swal2-input" placeholder="Telefone / WhatsApp" required>
            <hr>
            <input id="swal-cep" class="swal2-input" placeholder="CEP">
            <input id="swal-logradouro" class="swal2-input" placeholder="Rua / Avenida">
            <input id="swal-numero" class="swal2-input" placeholder="Número">
            <input id="swal-bairro" class="swal2-input" placeholder="Bairro">
            <input id="swal-cidade" class="swal2-input" placeholder="Cidade">
            <input id="swal-estado" class="swal2-input" placeholder="Estado (UF)">
            <input id="swal-complemento" class="swal2-input" placeholder="Complemento (opcional)">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Cadastrar e Entrar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                nome: document.getElementById('swal-nome').value,
                email: document.getElementById('swal-email').value,
                senha: document.getElementById('swal-senha').value,
                telefone: document.getElementById('swal-telefone').value,
                endereco: {
                    cep: document.getElementById('swal-cep').value,
                    logradouro: document.getElementById('swal-logradouro').value,
                    numero: document.getElementById('swal-numero').value,
                    bairro: document.getElementById('swal-bairro').value,
                    cidade: document.getElementById('swal-cidade').value,
                    estado: document.getElementById('swal-estado').value,
                    complemento: document.getElementById('swal-complemento').value,
                }
            };
        }
    });

    if (isConfirmed && formValues) {
        try {
            const response = await fetch('/api/clientes/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            });
            if (!response.ok) throw new Error('Falha no cadastro.');
            const customer = await response.json();
            loggedInCustomerData = customer;
            saveCustomerToStorageCarrinho(customer);
            Swal.fire('Sucesso!', 'Cadastro realizado e login efetuado!', 'success');
            updateCustomerUI();
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível realizar o cadastro.', 'error');
        }
    }
}

async function handleLogin() {
    const { value: formValues } = await Swal.fire({
        title: 'Login',
        html: `
            <input id="swal-email" class="swal2-input" placeholder="E-mail">
            <input id="swal-senha" type="password" class="swal2-input" placeholder="Senha">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Entrar',
        preConfirm: () => ({
            email: document.getElementById('swal-email').value,
            senha: document.getElementById('swal-senha').value
        })
    });

    if (formValues) {
        try {
            const response = await fetch('/api/clientes/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            });
            if (!response.ok) throw new Error('E-mail ou senha inválidos.');
            const customer = await response.json();
            loggedInCustomerData = customer;
            saveCustomerToStorageCarrinho(customer);
            Swal.fire('Bem-vindo(a)!', 'Login efetuado com sucesso!', 'success');
            updateCustomerUI();
        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    }
}

function handleLogout() {
    removeCustomerFromStorageCarrinho();
    loggedInCustomerData = null;
    Swal.fire('Até logo!', 'Você saiu da sua conta.', 'info');
    updateCustomerUI();
}

async function finalizeOrder() {
    if (Object.keys(cartData).length === 0) { Swal.fire('Carrinho Vazio!', 'Adicione itens ao seu carrinho para continuar.', 'warning'); return; }
    if (!loggedInCustomerData) { Swal.fire('Identifique-se!', 'Por favor, entre na sua conta ou cadastre-se para finalizar o pedido.', 'info'); return; }
    if (!loggedInCustomerData.endereco || !loggedInCustomerData.endereco.cep) { Swal.fire('Endereço Incompleto!', 'Por favor, complete seu endereço no cadastro para continuar.', 'warning'); return; }
    
    const formaPagamentoSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
    if (!formaPagamentoSelecionada) { Swal.fire('Atenção!', 'Por favor, selecione uma forma de pagamento.', 'warning'); return; }

    const pedidoItensPayload = [];

    for (const cartId in cartData) {
        const item = cartData[cartId];
        
        // 1. Adiciona o item principal (seja um produto simples ou um kit)
        pedidoItensPayload.push({
            produtoId: parseInt(item.id),
            quantidade: item.qtde,
            precoUnitario: item.preco
        });

        // 2. Se for um kit, adiciona suas opções como itens separados com preço 0
        // A baixa de estoque será feita pelo backend com base nesses itens.
        if (item.type === 'kit' && item.escolhas) {
            for (const nomeGrupo in item.escolhas) {
                item.escolhas[nomeGrupo].forEach(opcao => {
                    const produtoOpcao = todosProdutosGlobaisParaCarrinho.find(p => p.id == opcao.produtoId);
                    if (produtoOpcao) {
                         pedidoItensPayload.push({
                            produtoId: parseInt(opcao.produtoId),
                            // Multiplica a quantidade da opção pela quantidade de kits pedidos
                            quantidade: opcao.quantidade * item.qtde,
                            // O preço unitário aqui é 0, pois o valor já está no preço do Kit principal.
                            // O backend usará isso para saber que é um sub-item.
                            precoUnitario: 0 
                        });
                    }
                });
            }
        }
    }

    const payload = {
        clienteId: loggedInCustomerData.id,
        enderecoEntrega: loggedInCustomerData.endereco,
        itens: pedidoItensPayload,
        formaPagamento: formaPagamentoSelecionada.value,
    };
    
    Swal.fire({ title: 'Confirmando seu pedido...', text: 'Aguarde um momento.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        const response = await axios.post('/api/pedidos', payload);
        Swal.fire('Pedido Enviado!', `Seu pedido nº ${response.data.id} foi registrado com sucesso!`, 'success').then(() => {
            cartData = {};
            saveCartToStorageCarrinho();
            window.location.href = 'meus-pedidos.html';
        });
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Ocorreu um erro desconhecido.';
        Swal.fire('Ops! Algo deu errado', `Não foi possível registrar seu pedido: ${errorMsg}`, 'error');
    }
}

// --- INICIALIZAÇÃO DA PÁGINA DO CARRINHO ---
window.onload = async () => {
    cartData = getCartFromStorageCarrinho();
    loggedInCustomerData = getCustomerFromStorageCarrinho();

    await carregarTodosProdutosParaReferenciaCarrinho();

    updateCartCountNavbarCarrinho();
    displayCartItems();
    updateCustomerUI();

    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.getElementById('registerButton')?.addEventListener('click', handleRegister);
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);
    document.getElementById('finalizeOrderButton')?.addEventListener('click', finalizeOrder);
};