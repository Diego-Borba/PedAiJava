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

    if (!container || !emptyCartMessage || !checkoutSection) {
        console.error("Elementos essenciais do carrinho (cartItemsContainer, emptyCartMessage ou checkoutSection) não encontrados no DOM.");
        return;
    }
    container.innerHTML = ''; // Limpa itens antigos

    const productIds = Object.keys(cart);

    if (productIds.length === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutSection.style.display = 'none';
        updateCartSummary(0, 0);
        updateCartCountNavbar(); // Garante que a navbar também seja atualizada para 0 aqui
        return;
    }

    emptyCartMessage.style.display = 'none';
    checkoutSection.style.display = 'block';

    let totalGeralCompra = 0;
    let totalItensIndividuais = 0;

    productIds.forEach(id => {
        const item = cart[id];
        if (!item || typeof item.preco !== 'number' || typeof item.qtde !== 'number') {
            console.warn(`Item inválido ou sem preço/quantidade no carrinho: ID ${id}`, item);
            return; // Pula itens inválidos para evitar erros
        }
        const subtotal = item.preco * item.qtde;
        totalGeralCompra += subtotal;
        totalItensIndividuais += item.qtde;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row d-flex align-items-center';
        itemRow.innerHTML = `
            <img src="${item.imagem || PLACEHOLDER_IMAGE}" alt="${item.nome || 'Produto'}" class="cart-item-img">
            <div class="flex-grow-1 cart-item-details">
                <h5>${item.nome || 'Produto Indisponível'}</h5>
                <p class="text-muted mb-1">Preço Unit.: R$ ${(item.preco || 0).toFixed(2)}</p>
                <div class="d-flex align-items-center cart-item-actions">
                    <button class="btn btn-outline-secondary btn-sm" onclick="handleChangeQuantity('${id}', ${item.qtde - 1})">-</button>
                    <input type="number" class="form-control form-control-sm mx-2" value="${item.qtde}" readonly>
                    <button class="btn btn-outline-secondary btn-sm" onclick="handleChangeQuantity('${id}', ${item.qtde + 1})">+</button>
                </div>
            </div>
            <div class="text-end ms-3">
                <p class="mb-1 cart-item-subtotal">R$ ${subtotal.toFixed(2)}</p>
                <button class="btn btn-sm btn-outline-danger" onclick="handleRemoveItem('${id}')" title="Remover ${item.nome || 'Produto'}">
                    <i class="bi bi-trash3"></i> Remover
                </button>
            </div>
        `;
        container.appendChild(itemRow);
    });
    updateCartSummary(totalGeralCompra, totalItensIndividuais);
    updateFinalizeButtonState();
}

function updateCartSummary(totalGeral, totalItens) {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;

    const textoItens = totalItens === 1 ? "item" : "itens";

    summaryContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Subtotal (${totalItens} ${textoItens}):
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
    if (item.qtdeMax && newQuantity > item.qtdeMax) {
        Swal.fire({
            text: `A quantidade máxima para "${item.nome}" é ${item.qtdeMax}.`,
            icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
        });
        return;
    }
    item.qtde = newQuantity;
    saveCartToStorage();
    displayCartItems(); // Re-renderiza a lista e o resumo
    updateCartCountNavbar(); // Atualiza o contador da navbar
}

function handleRemoveItem(productId) {
    const itemRemovido = cart[productId];
    if (!itemRemovido) return; // Item já pode ter sido removido

    delete cart[productId];
    saveCartToStorage();
    displayCartItems(); // Re-renderiza a lista e o resumo
    updateCartCountNavbar(); // Atualiza o contador da navbar

    Swal.fire({
        text: `"${itemRemovido.nome}" removido do carrinho.`,
        icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
    });
}

// --- Lógica de Cliente e Finalização ---
async function fetchAddressFromViaCEP(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
        Swal.showValidationMessage(`CEP inválido (deve conter 8 números).`);
        return null;
    }
    try {
        Swal.showLoading();
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) {
            console.error("ViaCEP response error status:", response.status);
            throw new Error('Erro ao consultar o serviço de CEP.');
        }
        const data = await response.json();
        if (data.erro) {
            throw new Error('CEP não localizado.');
        }
        return data;
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        Swal.showValidationMessage(`${error.message}`);
        return null;
    } finally {
        Swal.hideLoading();
    }
}

async function handleRegister() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Crie sua Conta',
        html: `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto; padding-right: 15px;"> {/* Scroll para modal longo */}
                <label for="swal-input-name-reg" class="swal2-label">Nome Completo:</label>
                <input id="swal-input-name-reg" class="swal2-input" placeholder="Seu nome completo" required>

                <label for="swal-input-phone-reg" class="swal2-label">Telefone:</label>
                <input id="swal-input-phone-reg" class="swal2-input" placeholder="(XX) XXXXX-XXXX" type="tel" required>
                
                <hr class="my-3">
                <h5>Endereço de Entrega</h5>
                <label for="swal-input-cep-reg" class="swal2-label">CEP:</label>
                <div class="input-group mb-2">
                    <input id="swal-input-cep-reg" class="form-control swal2-input" placeholder="Apenas números" type="tel" maxlength="9" required style="border-right:0; flex-grow:1;">
                    <button type="button" id="swal-button-buscar-cep" class="btn btn-outline-secondary" style="border-color: #d9d9d9;"><i class="bi bi-search"></i></button>
                </div>

                <label for="swal-input-logradouro-reg" class="swal2-label">Endereço (Rua, Av.):</label>
                <input id="swal-input-logradouro-reg" class="swal2-input mb-2" placeholder="Preenchido automaticamente" readonly required>
                
                <div class="row g-2 mb-2">
                    <div class="col-sm-6">
                        <label for="swal-input-numero-reg" class="swal2-label">Número:</label>
                        <input id="swal-input-numero-reg" class="swal2-input" placeholder="Nº" required>
                    </div>
                    <div class="col-sm-6">
                        <label for="swal-input-complemento-reg" class="swal2-label">Complemento:</label>
                        <input id="swal-input-complemento-reg" class="swal2-input" placeholder="Apto, Bloco...">
                    </div>
                </div>
                
                <label for="swal-input-bairro-reg" class="swal2-label">Bairro:</label>
                <input id="swal-input-bairro-reg" class="swal2-input mb-2" placeholder="Preenchido automaticamente" readonly required>
                
                <div class="row g-2 mb-2">
                    <div class="col-sm-8">
                        <label for="swal-input-cidade-reg" class="swal2-label">Cidade:</label>
                        <input id="swal-input-cidade-reg" class="swal2-input" placeholder="Preenchido automaticamente" readonly required>
                    </div>
                    <div class="col-sm-4">
                        <label for="swal-input-estado-reg" class="swal2-label">UF:</label>
                        <input id="swal-input-estado-reg" class="swal2-input" placeholder="UF" readonly required>
                    </div>
                </div>

                <label for="swal-input-referencia-reg" class="swal2-label">Ponto de Referência:</label>
                <input id="swal-input-referencia-reg" class="swal2-input mb-2" placeholder="Opcional">
                
                <hr class="my-3">
                <h5>Dados de Acesso</h5>
                <label for="swal-input-email-reg" class="swal2-label">E-mail:</label>
                <input id="swal-input-email-reg" class="swal2-input mb-2" placeholder="Seu e-mail para login" type="email" required>
                
                <label for="swal-input-password-reg" class="swal2-label">Senha:</label>
                <input id="swal-input-password-reg" class="swal2-input" placeholder="Crie uma senha" type="password" required>
            </div>
        `,
        focusConfirm: false,
        width: '90%',
        customClass: {
            label: 'form-label text-start d-block mb-1 mt-2', // Ajuste para melhor espaçamento dos labels
            input: 'form-control form-control-sm', // Para consistência com inputs do Bootstrap
            htmlContainer: 'swal2-html-container-custom' // Para CSS customizado se necessário
        },
        confirmButtonText: 'Cadastrar e Entrar <i class="bi bi-check-circle"></i>',
        confirmButtonColor: '#28a745',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            const cepInput = document.getElementById('swal-input-cep-reg');
            const buscarCepButton = document.getElementById('swal-button-buscar-cep');
            const logradouroInput = document.getElementById('swal-input-logradouro-reg');
            const bairroInput = document.getElementById('swal-input-bairro-reg');
            const cidadeInput = document.getElementById('swal-input-cidade-reg');
            const estadoInput = document.getElementById('swal-input-estado-reg');
            const numeroInput = document.getElementById('swal-input-numero-reg');

            // Aplicar máscara simples de CEP (opcional, mas melhora UX)
            cepInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 5) {
                    value = value.substring(0, 5) + '-' + value.substring(5, 8);
                }
                e.target.value = value.substring(0, 9);
            });


            const fillAddressFields = (data) => {
                logradouroInput.value = data.logradouro || '';
                bairroInput.value = data.bairro || '';
                cidadeInput.value = data.localidade || '';
                estadoInput.value = data.uf || '';
                
                logradouroInput.readOnly = !!data.logradouro;
                bairroInput.readOnly = !!data.bairro;
                cidadeInput.readOnly = !!data.localidade;
                estadoInput.readOnly = !!data.uf;

                if (data.logradouro || data.bairro) {
                    numeroInput.focus();
                } else {
                    logradouroInput.focus();
                }
            };
            
            const handleCepSearch = async () => {
                const cep = cepInput.value.replace(/\D/g, ''); // Limpa máscara antes de enviar
                if (cep.length !== 8) {
                     Swal.showValidationMessage('CEP deve ter 8 números.');
                     return;
                }
                const addressData = await fetchAddressFromViaCEP(cep);
                if (addressData) {
                    fillAddressFields(addressData);
                } else {
                    [logradouroInput, bairroInput, cidadeInput, estadoInput].forEach(input => {
                        input.value = ''; input.readOnly = false;
                    });
                }
            };

            buscarCepButton.addEventListener('click', handleCepSearch);
            cepInput.addEventListener('blur', async () => {
                const cep = cepInput.value.replace(/\D/g, '');
                if (cep.length === 8 && (!logradouroInput.value || logradouroInput.readOnly === false)) {
                    await handleCepSearch();
                }
            });
        },
        preConfirm: () => {
            const getVal = (id) => document.getElementById(id)?.value || ''; // Adiciona verificação de nulidade
            const nome = getVal('swal-input-name-reg');
            const telefone = getVal('swal-input-phone-reg').replace(/\D/g, '');
            const cep = getVal('swal-input-cep-reg').replace(/\D/g, '');
            const logradouro = getVal('swal-input-logradouro-reg');
            const numero = getVal('swal-input-numero-reg');
            const complemento = getVal('swal-input-complemento-reg');
            const bairro = getVal('swal-input-bairro-reg');
            const cidade = getVal('swal-input-cidade-reg');
            const estado = getVal('swal-input-estado-reg');
            const referencia = getVal('swal-input-referencia-reg');
            const email = getVal('swal-input-email-reg');
            const password = getVal('swal-input-password-reg');

            let errors = [];
            if (!nome.trim()) errors.push("Nome completo");
            if (!telefone || telefone.length < 10 || telefone.length > 11) errors.push("Telefone (10-11 dígitos)");
            if (!cep || cep.length !== 8) errors.push("CEP (8 dígitos)");
            if (!logradouro.trim()) errors.push("Endereço");
            if (!numero.trim()) errors.push("Número");
            if (!bairro.trim()) errors.push("Bairro");
            if (!cidade.trim()) errors.push("Cidade");
            if (!estado.trim()) errors.push("Estado (UF)");
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail válido"); // Validação simples de email
            if (!password || password.length < 6) errors.push("Senha (mínimo 6 caracteres)"); // Exemplo de validação de senha

            if (errors.length > 0) {
                Swal.showValidationMessage(`Campos obrigatórios ou inválidos: ${errors.join(', ')}.`);
                return false;
            }
            return { nome, telefone, email, password,
                     endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado, referencia }
                   };
        }
    });

    if (isConfirmed && formValues) {
        loggedInCustomer = {
            id: 'user-' + Date.now(), nome: formValues.nome, email: formValues.email,
            telefone: formValues.telefone, endereco: formValues.endereco
        };
        saveCustomerToStorage(loggedInCustomer);
        updateCustomerUI();
        Swal.fire('Cadastro Realizado!', 'Bem-vindo(a) ao PedAi! Você já está logado.', 'success');
    }
}

function updateCustomerUI() {
    const loggedInDiv = document.getElementById('loggedInCustomer');
    const guestDiv = document.getElementById('guestCustomer');
    const customerNameEl = document.getElementById('customerName');
    const customerDetailsEl = document.getElementById('customerDetails');

    if (loggedInCustomer) {
        if(customerNameEl) customerNameEl.textContent = loggedInCustomer.nome || 'Cliente';
        
        if (customerDetailsEl && loggedInCustomer.endereco && loggedInCustomer.endereco.cep) { // Verifica se há endereço e CEP
            const addr = loggedInCustomer.endereco;
            customerDetailsEl.innerHTML = `
                <small>
                    <strong>Tel:</strong> ${loggedInCustomer.telefone ? formatPhoneNumber(loggedInCustomer.telefone) : 'Não informado'}<br>
                    <strong>Endereço:</strong> ${addr.logradouro || ''}, ${addr.numero || ''}${addr.complemento ? ' ('+addr.complemento+')' : ''}<br>
                    ${addr.bairro || ''} - ${addr.cidade || ''}/${addr.estado || ''}<br>
                    <strong>CEP:</strong> ${addr.cep ? formatCEP(addr.cep) : ''}
                    ${addr.referencia ? `<br><strong>Ref:</strong> ${addr.referencia}` : ''}
                </small>
            `;
            customerDetailsEl.style.display = 'block';
        } else if (customerDetailsEl) {
            customerDetailsEl.innerHTML = '<small><em>Endereço não cadastrado. Por favor, atualize seu cadastro.</em></small>';
            customerDetailsEl.style.display = 'block'; // Mostra a mensagem
        }
        if(loggedInDiv) loggedInDiv.style.display = 'flex';
        if(guestDiv) guestDiv.style.display = 'none';
    } else {
        if(loggedInDiv) loggedInDiv.style.display = 'none';
        if(guestDiv) guestDiv.style.display = 'block';
        if(customerDetailsEl) customerDetailsEl.style.display = 'none';
    }
    updateFinalizeButtonState();
}

function formatPhoneNumber(phone) {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) { return `(${match[1]}) ${match[2]}-${match[3]}`; }
    return phone;
}
function formatCEP(cep) {
    const cleaned = ('' + cep).replace(/\D/g, '');
    if (cep.length === 8) { // Garante que só formata se tiver 8 dígitos limpos
      const match = cleaned.match(/^(\d{5})(\d{3})$/);
      if (match) { return `${match[1]}-${match[2]}`; }
    }
    return cep; // Retorna o CEP original (ou limpo) se não puder formatar
}

async function handleLogin() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Entrar na sua Conta',
        html:
            '<input id="swal-input-email" class="swal2-input" placeholder="Seu e-mail" type="email" style="margin-bottom: 0.5em;">' +
            '<input id="swal-input-password" class="swal2-input" placeholder="Sua senha" type="password">',
        focusConfirm: false, confirmButtonText: 'Entrar <i class="bi bi-arrow-right-circle"></i>',
        confirmButtonColor: '#ff5722', showCancelButton: true, cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const email = document.getElementById('swal-input-email').value;
            const password = document.getElementById('swal-input-password').value;
            if (!email || !password) { Swal.showValidationMessage(`Por favor, preencha e-mail e senha`); return false; }
            return { email: email, password: password };
        }
    });

    if (isConfirmed && formValues) {
        const potentialExistingCustomer = getCustomerFromStorage();
        if (potentialExistingCustomer && potentialExistingCustomer.email === formValues.email) {
            // Simulação de validação de senha - em um app real, isso seria feito no backend
            // if (potentialExistingCustomer.password === formValues.password) { // Supondo que a senha está armazenada (não seguro para produção)
                loggedInCustomer = potentialExistingCustomer;
                Swal.fire('Bem-vindo(a) de volta!', 'Login realizado com sucesso.', 'success');
            // } else {
            //     Swal.fire('Login Falhou', 'Senha inválida.', 'error');
            //     return;
            // }
        } else {
            Swal.fire('Login Falhou', 'E-mail não cadastrado. Se você é novo, por favor, cadastre-se.', 'error');
            return;
        }
        saveCustomerToStorage(loggedInCustomer);
        updateCustomerUI();
    }
}

function handleLogout() {
    Swal.fire({
        title: 'Sair da conta?',
        text: "Você precisará fazer login novamente para finalizar um pedido.",
        icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar', confirmButtonColor: '#dc3545',
    }).then((result) => {
        if (result.isConfirmed) {
            removeCustomerFromStorage();
            loggedInCustomer = null;
            updateCustomerUI();
        }
    });
}

function updateFinalizeButtonState() {
    const finalizeBtn = document.getElementById('finalizeOrderButton');
    if (!finalizeBtn) return;
    const productIds = Object.keys(cart);
    // Habilita o botão se houver itens no carrinho, cliente logado, e informações essenciais do endereço preenchidas
    const addressComplete = loggedInCustomer && loggedInCustomer.endereco &&
                            loggedInCustomer.endereco.logradouro && loggedInCustomer.endereco.numero &&
                            loggedInCustomer.endereco.bairro && loggedInCustomer.endereco.cidade &&
                            loggedInCustomer.endereco.estado && loggedInCustomer.endereco.cep;
    finalizeBtn.disabled = !(productIds.length > 0 && loggedInCustomer && addressComplete);
}

async function finalizeOrder() {
    if (Object.keys(cart).length === 0) {
        Swal.fire('Carrinho Vazio!', 'Adicione itens ao carrinho antes de finalizar.', 'warning'); return;
    }
    if (!loggedInCustomer) {
        Swal.fire('Identifique-se!', 'Por favor, entre ou cadastre-se para continuar.', 'info'); return;
    }
    if (!loggedInCustomer.endereco || !loggedInCustomer.endereco.logradouro || !loggedInCustomer.endereco.numero || !loggedInCustomer.endereco.bairro || !loggedInCustomer.endereco.cidade || !loggedInCustomer.endereco.estado || !loggedInCustomer.endereco.cep) {
        Swal.fire('Endereço Incompleto!', 'Por favor, complete seu cadastro com um endereço de entrega válido para finalizar o pedido.', 'warning'); return;
    }

    const formaPagamentoSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
    if (!formaPagamentoSelecionada) {
        Swal.fire('Atenção!', 'Por favor, selecione uma forma de pagamento.', 'warning'); return;
    }

    const pedidoItens = Object.values(cart).map(item => ({
        produtoId: item.id,
        quantidade: item.qtde,
        precoUnitario: item.preco
    }));

    const payload = {
        itens: pedidoItens,
        formaPagamento: formaPagamentoSelecionada.value,
        // O backend deverá buscar/associar o cliente pelo usuário autenticado (não implementado aqui)
        // Se precisar enviar dados do cliente explicitamente (não ideal para segurança se não autenticado via token):
        // cliente: { 
        //     nome: loggedInCustomer.nome, 
        //     telefone: loggedInCustomer.telefone, 
        //     endereco: loggedInCustomer.endereco 
        // }
    };

    Swal.fire({
        title: 'Confirmando seu pedido...', text: 'Estamos quase lá!',
        allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao processar o pedido.' }));
            throw new Error(errorData.message || `Ocorreu um erro (${response.status})`);
        }

        const data = await response.json();
        Swal.fire({
            title: 'Pedido Enviado!',
            html: `Oba! Seu pedido <strong>nº ${data.id || ''}</strong> foi enviado com sucesso.<br>Forma de pagamento: ${data.formaPagamento || formaPagamentoSelecionada.value}.<br>Agradecemos a preferência!`,
            icon: 'success',
            confirmButtonText: 'Continuar Comprando',
            confirmButtonColor: '#ff5722',
        }).then((result) => {
            if (result.isConfirmed) {
                cart = {};
                saveCartToStorage();
                updateCartCountNavbar();
                displayCartItems(); // Para limpar a UI do carrinho atual
                window.location.href = 'Pedidos.html'; // Redireciona para a tela de pedidos (cardápio)
            }
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

    // Adiciona listeners aos botões corretos
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    } else {
        console.warn("Botão 'loginButton' não encontrado no HTML.");
    }

    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', handleRegister);
    } else {
        console.warn("Botão 'registerButton' não encontrado no HTML.");
    }
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    } else {
        // Este botão só aparece se logado, então o warning pode ser excessivo se o usuário não estiver logado.
        // console.warn("Botão 'logoutButton' não encontrado no HTML."); 
    }
    
    const finalizeButton = document.getElementById('finalizeOrderButton');
    if (finalizeButton) {
        finalizeButton.addEventListener('click', finalizeOrder);
    } else {
        console.warn("Botão 'finalizeOrderButton' não encontrado no HTML.");
    }
};