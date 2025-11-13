// static/js/carrinho.js
const CART_STORAGE_KEY_CARRINHO = 'pedAiCart';
const CUSTOMER_STORAGE_KEY_CARRINHO = 'pedAiCustomer';
const PLACEHOLDER_IMAGE_CARRINHO = 'https://via.placeholder.com/150x150.png?text=PedAi';

let cartData = {};
let loggedInCustomerData = null;
let todosProdutosGlobaisParaCarrinho = [];

// --- GERENCIAMENTO DO LOCALSTORAGE (SEU CÓDIGO ORIGINAL) ---
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

// --- CARREGAR PRODUTOS GLOBAIS (SEU CÓDIGO ORIGINAL) ---
async function carregarTodosProdutosParaReferenciaCarrinho() {
    try {
        // CORREÇÃO: Alterado de /api/produtos para /api/produtos/cardapio
        const response = await fetch('/api/produtos/cardapio');
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        todosProdutosGlobaisParaCarrinho = (await response.json()).map(p => ({ ...p, id: String(p.id) }));
    } catch (error) {
        console.error("Falha ao carregar produtos globais (carrinho.js):", error);
    }
}

// --- UI DO CARRINHO (SEU CÓDIGO ORIGINAL) ---
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

        // CORREÇÃO: Lógica para construir a imagem Base64
        let imagemSrc = PLACEHOLDER_IMAGE_CARRINHO;
        if (itemPrincipal.imagem && itemPrincipal.imagemTipo) {
            imagemSrc = `data:${itemPrincipal.imagemTipo};base64,${itemPrincipal.imagem}`;
        }

        itemRow.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${imagemSrc}" alt="${itemPrincipal.nome || 'Produto'}" class="cart-item-img">
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

// --- FUNÇÃO DE UI DO CLIENTE (ATUALIZADA) ---
function updateCustomerUI() {
    const loggedInDiv = document.getElementById('loggedInCustomer');
    const guestDiv = document.getElementById('guestCustomer');
    const customerNameSpan = document.getElementById('customerName');
    const customerDetailsDiv = document.getElementById('customerDetails');

    if (loggedInCustomerData) {
        loggedInDiv.style.display = 'flex';
        guestDiv.style.display = 'none';
        customerNameSpan.textContent = loggedInCustomerData.nome;

        // Lógica para mostrar/esconder o endereço
        const tipoPedidoSelecionado = document.querySelector('input[name="tipoPedido"]:checked').value;
        if (tipoPedidoSelecionado === 'ENTREGA' && loggedInCustomerData.endereco) {
            customerDetailsDiv.style.display = 'block';
            customerDetailsDiv.innerHTML = `
                <i class="bi bi-truck"></i> Entregar em: 
                ${loggedInCustomerData.endereco.logradouro || ''}, 
                ${loggedInCustomerData.endereco.numero || ''} - 
                ${loggedInCustomerData.endereco.bairro || ''}`;
        } else {
            customerDetailsDiv.style.display = 'none';
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

// --- FUNÇÕES DE LOGIN/CADASTRO (SEU CÓDIGO ORIGINAL) ---
async function handleRegister() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Cadastro Rápido',
        width: '800px',
        html: `
            <style>
              .swal2-html-container { overflow: visible !important; }
              .swal-label { text-align: left !important; font-size: 0.9rem; margin-bottom: 0.2rem; }
              #cep-status { font-size: 0.8rem; height: 1.2rem; }
            </style>
            <div class="container-fluid">
              <h6 class="text-start">Dados Pessoais</h6><hr class="mt-1">
              <div class="row">
                <div class="col-md-6 mb-3"><p class="swal-label">Nome Completo</p><input id="swal-nome" class="form-control" placeholder="Nome Completo" required></div>
                <div class="col-md-6 mb-3"><p class="swal-label">E-mail</p><input id="swal-email" type="email" class="form-control" placeholder="E-mail" required></div>
                <div class="col-md-6 mb-3"><p class="swal-label">Senha</p><input id="swal-senha" type="password" class="form-control" placeholder="Senha" required></div>
                <div class="col-md-6 mb-3"><p class="swal-label">Telefone / WhatsApp</p><input id="swal-telefone" type="tel" class="form-control" placeholder="Telefone / WhatsApp" required></div>
              </div>
              <h6 class="text-start mt-3">Endereço de Entrega</h6><hr class="mt-1">
              <div class="row">
                <div class="col-md-4 mb-3"><p class="swal-label">CEP</p><input id="swal-cep" class="form-control" placeholder="Apenas números"><div id="cep-status" class="text-muted mt-1"></div></div>
                <div class="col-md-8 mb-3"><p class="swal-label">Rua / Avenida</p><input id="swal-logradouro" class="form-control" placeholder="Rua / Avenida"></div>
                <div class="col-md-4 mb-3"><p class="swal-label">Número</p><input id="swal-numero" class="form-control" placeholder="Número"></div>
                <div class="col-md-8 mb-3"><p class="swal-label">Bairro</p><input id="swal-bairro" class="form-control" placeholder="Bairro"></div>
                <div class="col-md-6 mb-3"><p class="swal-label">Cidade</p><input id="swal-cidade" class="form-control" placeholder="Cidade"></div>
                <div class="col-md-6 mb-3"><p class="swal-label">Estado (UF)</p><input id="swal-estado" class="form-control" placeholder="Estado (UF)"></div>
                <div class="col-12"><p class="swal-label">Complemento (opcional)</p><input id="swal-complemento" class="form-control" placeholder="Apto, Bloco, etc."></div>
              </div>
            </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Cadastrar e Entrar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            const cepInput = document.getElementById('swal-cep');
            const statusDiv = document.getElementById('cep-status');
            const logradouroInput = document.getElementById('swal-logradouro');
            const bairroInput = document.getElementById('swal-bairro');
            const cidadeInput = document.getElementById('swal-cidade');
            const estadoInput = document.getElementById('swal-estado');
            const numeroInput = document.getElementById('swal-numero');
            cepInput.addEventListener('blur', async (e) => {
                const cep = e.target.value.replace(/\D/g, '');
                if (cep.length !== 8) { statusDiv.textContent = ''; return; }
                statusDiv.textContent = 'Buscando...';
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    if (!response.ok) throw new Error('CEP não encontrado.');
                    const data = await response.json();
                    if (data.erro) throw new Error('CEP inválido.');
                    logradouroInput.value = data.logradouro;
                    bairroInput.value = data.bairro;
                    cidadeInput.value = data.localidade;
                    estadoInput.value = data.uf;
                    statusDiv.textContent = 'Endereço encontrado!';
                    statusDiv.classList.remove('text-danger');
                    statusDiv.classList.add('text-success');
                    numeroInput.focus();
                } catch (error) {
                    statusDiv.textContent = error.message;
                    statusDiv.classList.remove('text-success');
                    statusDiv.classList.add('text-danger');
                }
            });
        },
        preConfirm: () => ({
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
        })
    });

    if (isConfirmed && formValues) {
        try {
            if (!formValues.nome || !formValues.email || !formValues.senha) {
                throw new Error('Nome, e-mail e senha são obrigatórios.');
            }
            const response = await fetch('/api/clientes/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha no cadastro.');
            }
            const customer = await response.json();
            loggedInCustomerData = customer;
            saveCustomerToStorageCarrinho(customer);
            Swal.fire('Sucesso!', 'Cadastro realizado e login efetuado!', 'success');
            updateCustomerUI();
        } catch (error) {
            Swal.fire('Erro!', `Não foi possível realizar o cadastro: ${error.message}`, 'error');
        }
    }
}

async function handleLogin() {
    const { value: formValues } = await Swal.fire({
        title: 'Login',
        html: `<input id="swal-email" class="swal2-input" placeholder="E-mail"><input id="swal-senha" type="password" class="swal2-input" placeholder="Senha">`,
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

// --- FUNÇÃO DE FINALIZAR PEDIDO (ATUALIZADA) ---
async function finalizeOrder() {
    if (Object.keys(cartData).length === 0) { Swal.fire('Carrinho Vazio!', 'Adicione itens ao seu carrinho para continuar.', 'warning'); return; }
    if (!loggedInCustomerData) { Swal.fire('Identifique-se!', 'Por favor, entre na sua conta ou cadastre-se para finalizar o pedido.', 'info'); return; }

    const formaPagamentoSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
    if (!formaPagamentoSelecionada) { Swal.fire('Atenção!', 'Por favor, selecione uma forma de pagamento.', 'warning'); return; }

    // NOVAS VALIDAÇÕES DE TIPO DE PEDIDO
    const tipoPedido = document.querySelector('input[name="tipoPedido"]:checked').value;
    const dataAgendamentoInput = document.getElementById('dataAgendamento');
    let dataAgendamento = null;

    if (tipoPedido === 'ENCOMENDA') {
        if (!dataAgendamentoInput.value) {
            Swal.fire('Atenção!', 'Por favor, selecione a data e a hora para a sua encomenda.', 'warning');
            return;
        }
        // Converte para o formato ISO 8601 que o ZonedDateTime do backend espera
        dataAgendamento = new Date(dataAgendamentoInput.value).toISOString();
    }

    if (tipoPedido === 'ENTREGA' && (!loggedInCustomerData.endereco || !loggedInCustomerData.endereco.cep)) {
        Swal.fire('Endereço Incompleto!', 'Por favor, complete seu endereço no cadastro para pedidos de entrega.', 'warning');
        return;
    }

    // Montagem do payload de itens (seu código original)
    const pedidoItensPayload = [];
    for (const cartId in cartData) {
        const item = cartData[cartId];
        pedidoItensPayload.push({
            produtoId: parseInt(item.id),
            quantidade: item.qtde,
            precoUnitario: item.preco
        });

        if (item.type === 'kit' && item.escolhas) {
            for (const nomeGrupo in item.escolhas) {
                item.escolhas[nomeGrupo].forEach(opcao => {
                    const produtoOpcao = todosProdutosGlobaisParaCarrinho.find(p => p.id == opcao.produtoId);
                    if (produtoOpcao) {
                        pedidoItensPayload.push({
                            produtoId: parseInt(opcao.produtoId),
                            quantidade: opcao.quantidade * item.qtde,
                            precoUnitario: 0
                        });
                    }
                });
            }
        }
    }

    // PAYLOAD FINAL ENVIADO PARA A API (ATUALIZADO)
    const payload = {
        clienteId: loggedInCustomerData.id,
        itens: pedidoItensPayload,
        formaPagamento: formaPagamentoSelecionada.value,
        tipo: tipoPedido,
        enderecoEntrega: tipoPedido === 'ENTREGA' ? loggedInCustomerData.endereco : null,
        dataAgendamento: dataAgendamento
    };

    Swal.fire({ title: 'Confirmando seu pedido...', text: 'Aguarde um momento.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro desconhecido');
        }
        const data = await response.json();
        Swal.fire('Pedido Enviado!', `Seu pedido nº ${data.id} foi registrado com sucesso!`, 'success').then(() => {
            cartData = {};
            saveCartToStorageCarrinho();
            window.location.href = 'meus-pedidos.html';
        });
    } catch (err) {
        Swal.fire('Ops! Algo deu errado', `Não foi possível registrar seu pedido: ${err.message}`, 'error');
    }
}

// --- INICIALIZAÇÃO DA PÁGINA (ATUALIZADA) ---
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

    // ADICIONADO: Listeners para os tipos de pedido
    const agendamentoSection = document.getElementById('agendamentoSection');
    document.querySelectorAll('input[name="tipoPedido"]').forEach(radio => {
        radio.addEventListener('change', function () {
            agendamentoSection.style.display = this.value === 'ENCOMENDA' ? 'block' : 'none';
            updateCustomerUI(); // Atualiza a exibição do endereço
        });
    });
};