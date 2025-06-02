// static/js/carrinho.js
const CART_STORAGE_KEY = 'pedAiCart';
const CUSTOMER_STORAGE_KEY = 'pedAiCustomer';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi';

let cart = {};
let loggedInCustomer = null;

// --- Funções de Gerenciamento do LocalStorage ---
function getCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : {};
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCustomerFromStorage() {
    const storedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return storedCustomer ? JSON.parse(storedCustomer) : null;
}

function saveCustomerToStorage(customer) {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
}

function removeCustomerFromStorage() {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
}


// --- Funções da UI do Carrinho ---
function updateCartCountNavbar() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) return;
    let totalItensNoCarrinho = 0;
    Object.values(cart).forEach(item => {
        totalItensNoCarrinho += item.qtde;
    });
    cartCountEl.innerText = totalItensNoCarrinho;
}

function displayCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const checkoutSection = document.getElementById('checkoutSection');
    
    if (!container || !emptyCartMessage || !checkoutSection) return;
    container.innerHTML = ''; // Limpa itens antigos

    const productIds = Object.keys(cart);

    if (productIds.length === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutSection.style.display = 'none';
        updateCartSummary(0); // Atualiza o resumo para zero
        return;
    }

    emptyCartMessage.style.display = 'none';
    checkoutSection.style.display = 'block';

    let totalGeralCompra = 0;

    productIds.forEach(id => {
        const item = cart[id];
        const subtotal = item.qtde * item.preco;
        totalGeralCompra += subtotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row d-flex align-items-center';
        itemRow.innerHTML = `
            <img src="${item.imagem || PLACEHOLDER_IMAGE}" alt="${item.nome}" class="cart-item-img">
            <div class="flex-grow-1 cart-item-details">
                <h5>${item.nome}</h5>
                <p class="text-muted mb-1">Preço Unit.: R$ ${item.preco.toFixed(2)}</p>
                <div class="d-flex align-items-center cart-item-actions">
                    <button class="btn btn-outline-secondary btn-sm" onclick="handleChangeQuantity(${id}, ${item.qtde - 1})">-</button>
                    <input type="number" class="form-control form-control-sm mx-2" value="${item.qtde}" readonly>
                    <button class="btn btn-outline-secondary btn-sm" onclick="handleChangeQuantity(${id}, ${item.qtde + 1})">+</button>
                </div>
            </div>
            <div class="text-end ms-3">
                <p class="mb-1 cart-item-subtotal">R$ ${subtotal.toFixed(2)}</p>
                <button class="btn btn-sm btn-outline-danger" onclick="handleRemoveItem(${id})" title="Remover ${item.nome}">
                    <i class="bi bi-trash3"></i> Remover
                </button>
            </div>
        `;
        container.appendChild(itemRow);
    });
    updateCartSummary(totalGeralCompra);
    updateFinalizeButtonState();
}

function updateCartSummary(totalGeral) {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;

    // Você pode adicionar mais detalhes como frete aqui se necessário
    summaryContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Subtotal dos Produtos:
                <span>R$ ${totalGeral.toFixed(2)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>Total do Pedido:</strong>
                <strong class="total-value">R$ ${totalGeral.toFixed(2)}</strong>
            </li>
        </ul>
    `;
}

function handleChangeQuantity(productId, newQuantity) {
    const item = cart[productId];
    if (!item) return;

    newQuantity = parseInt(newQuantity);

    if (newQuantity <= 0) {
        handleRemoveItem(productId);
        return;
    }
    if (newQuantity > item.qtdeMax) {
        Swal.fire({
            text: `A quantidade máxima para "${item.nome}" é ${item.qtdeMax}.`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }
    item.qtde = newQuantity;
    saveCartToStorage();
    displayCartItems();
    updateCartCountNavbar();
}

function handleRemoveItem(productId) {
    const itemRemovido = cart[productId];
    delete cart[productId];
    saveCartToStorage();
    displayCartItems();
    updateCartCountNavbar();

    if (itemRemovido) {
        Swal.fire({
            text: `"${itemRemovido.nome}" removido do carrinho.`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    }
}

// --- Lógica de Cliente e Finalização ---
function updateCustomerUI() {
    const loggedInDiv = document.getElementById('loggedInCustomer');
    const guestDiv = document.getElementById('guestCustomer');
    const customerNameEl = document.getElementById('customerName');

    if (loggedInCustomer) {
        customerNameEl.textContent = loggedInCustomer.nome || 'Cliente';
        loggedInDiv.style.display = 'block';
        guestDiv.style.display = 'none';
    } else {
        loggedInDiv.style.display = 'none';
        guestDiv.style.display = 'block';
    }
    updateFinalizeButtonState();
}

function updateFinalizeButtonState() {
    const finalizeBtn = document.getElementById('finalizeOrderButton');
    const productIds = Object.keys(cart);
    // Habilita o botão se houver itens no carrinho E cliente logado
    finalizeBtn.disabled = !(productIds.length > 0 && loggedInCustomer);
}


async function handleLogin() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Entrar na sua Conta',
        html:
            '<input id="swal-input-email" class="swal2-input" placeholder="Seu e-mail" type="email">' +
            '<input id="swal-input-password" class="swal2-input" placeholder="Sua senha" type="password">',
        focusConfirm: false,
        confirmButtonText: 'Entrar <i class="bi bi-arrow-right-circle"></i>',
        confirmButtonColor: '#ff5722',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const email = document.getElementById('swal-input-email').value;
            const password = document.getElementById('swal-input-password').value;
            if (!email || !password) {
                Swal.showValidationMessage(`Por favor, preencha e-mail e senha`);
                return false;
            }
            return { email: email, password: password };
        }
    });

    if (isConfirmed && formValues) {
        // SIMULAÇÃO DE LOGIN: Em um app real, aqui você chamaria seu backend.
        // Por agora, vamos apenas simular que o login foi bem-sucedido.
        // E vamos usar o email como nome.
        console.log('Simulando login para:', formValues.email);
        loggedInCustomer = { id: 'user-' + Date.now(), nome: formValues.email.split('@')[0], email: formValues.email };
        saveCustomerToStorage(loggedInCustomer);
        updateCustomerUI();
        Swal.fire('Bem-vindo(a)!', 'Login realizado com sucesso.', 'success');
    }
}

async function handleRegister() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Crie sua Conta Rapidinho!',
        html:
            '<input id="swal-input-name-reg" class="swal2-input" placeholder="Seu nome completo">' +
            '<input id="swal-input-email-reg" class="swal2-input" placeholder="Seu e-mail" type="email">' +
            '<input id="swal-input-phone-reg" class="swal2-input" placeholder="Seu telefone (opcional)" type="tel">' +
            '<input id="swal-input-password-reg" class="swal2-input" placeholder="Crie uma senha" type="password">',
        focusConfirm: false,
        confirmButtonText: 'Cadastrar e Entrar <i class="bi bi-check-circle"></i>',
        confirmButtonColor: '#28a745',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nome = document.getElementById('swal-input-name-reg').value;
            const email = document.getElementById('swal-input-email-reg').value;
            const telefone = document.getElementById('swal-input-phone-reg').value;
            const password = document.getElementById('swal-input-password-reg').value;
            if (!nome || !email || !password) {
                Swal.showValidationMessage(`Nome, e-mail e senha são obrigatórios`);
                return false;
            }
            // Adicionar mais validações se necessário (formato do email, força da senha)
            return { nome, email, telefone, password };
        }
    });

    if (isConfirmed && formValues) {
        // SIMULAÇÃO DE CADASTRO: Em um app real, aqui você chamaria seu backend para registrar.
        console.log('Simulando cadastro para:', formValues.nome, formValues.email);
        loggedInCustomer = { id: 'user-' + Date.now(), nome: formValues.nome, email: formValues.email, telefone: formValues.telefone };
        saveCustomerToStorage(loggedInCustomer);
        updateCustomerUI();
        Swal.fire('Cadastro Realizado!', 'Bem-vindo(a) ao PedAi! Você já está logado.', 'success');
    }
}

function handleLogout() {
    Swal.fire({
        title: 'Sair da conta?',
        text: "Você precisará fazer login novamente para finalizar um pedido.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
    }).then((result) => {
        if (result.isConfirmed) {
            removeCustomerFromStorage();
            loggedInCustomer = null;
            updateCustomerUI();
        }
    });
}


async function finalizeOrder() {
    if (Object.keys(cart).length === 0) {
        Swal.fire('Carrinho Vazio!', 'Adicione itens ao carrinho antes de finalizar.', 'warning');
        return;
    }
    if (!loggedInCustomer) {
        Swal.fire('Identifique-se!', 'Por favor, entre ou cadastre-se para continuar.', 'info');
        // Poderia chamar handleLogin() ou handleRegister() aqui ou deixar o usuário clicar nos botões.
        return;
    }

    const pedidoItens = Object.values(cart).map(item => ({
        produtoId: item.id,
        quantidade: item.qtde,
        precoUnitario: item.preco
    }));
    
    // Adicionar clienteId ao payload do pedido se o backend suportar
    const payload = {
        // clienteId: loggedInCustomer.id, // Descomente se o backend esperar isso
        itens: pedidoItens
    };

    Swal.fire({
        title: 'Confirmando seu pedido...',
        text: 'Estamos quase lá!',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch('/api/pedidos', { // Endpoint do backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
            throw new Error(errorData.message || `Erro ${response.status}`);
        }

        const data = await response.json();
        Swal.fire({
            title: 'Pedido Enviado!',
            html: `Oba! Seu pedido <strong>nº ${data.id}</strong> foi enviado com sucesso.<br>Agradecemos a preferência!`,
            icon: 'success',
            confirmButtonText: 'Continuar Comprando',
            confirmButtonColor: '#ff5722',
        }).then(() => {
            // Limpar o carrinho e redirecionar para a página de pedidos ou uma página de "obrigado"
            cart = {};
            saveCartToStorage();
            updateCartCountNavbar();
            displayCartItems(); // Isso mostrará a mensagem de carrinho vazio
            // window.location.href = 'Pedidos.html'; // Opcional: redirecionar
        });

    } catch (err) {
        console.error('Erro ao finalizar pedido:', err);
        Swal.fire('Ops! Algo deu errado.', `Não foi possível enviar seu pedido: ${err.message}`, 'error');
    }
}


// --- Inicialização da Página do Carrinho ---
window.onload = () => {
    cart = getCartFromStorage();
    loggedInCustomer = getCustomerFromStorage();

    updateCartCountNavbar();
    displayCartItems();
    updateCustomerUI();

    // Adicionar event listeners para os botões de login/cadastro/logout
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.getElementById('registerButton')?.addEventListener('click', handleRegister);
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);
    document.getElementById('finalizeOrderButton')?.addEventListener('click', finalizeOrder);
};