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
    // Log para verificar os dados ANTES de redesenhar a UI
    console.log("[SAVE_CART] Dados em cartData ANTES de displayCartItems:", JSON.parse(JSON.stringify(cartData)));
    console.log("[SAVE_CART] Carrinho salvo (carrinho.js), chamando atualização da UI...");
    displayCartItems();
    updateCartCountNavbarCarrinho();
}

// ... (demais funções de customer storage permanecem iguais) ...
function getCustomerFromStorageCarrinho() { const s = localStorage.getItem(CUSTOMER_STORAGE_KEY_CARRINHO); try { const p = JSON.parse(s); return typeof p === 'object' && p !== null ? p : null; } catch (e) { return null; } }
function saveCustomerToStorageCarrinho(c) { localStorage.setItem(CUSTOMER_STORAGE_KEY_CARRINHO, JSON.stringify(c)); }
function removeCustomerFromStorageCarrinho() { localStorage.removeItem(CUSTOMER_STORAGE_KEY_CARRINHO); }

// --- CARREGAR PRODUTOS GLOBAIS ---
async function carregarTodosProdutosParaReferenciaCarrinho() {
    try {
        const response = await axios.get('/api/produtos');
        todosProdutosGlobaisParaCarrinho = response.data.map(p => ({
            ...p,
            id: String(p.id),
            isComplemento: p.isComplemento === true || p.complemento === true,
            permiteComplementos: p.permiteComplementos === true,
            ativo: p.ativo !== false,
            qtdeMax: parseInt(p.qtdeMax) || 99,
            complementosDisponiveis: Array.isArray(p.complementosDisponiveis) ? p.complementosDisponiveis.map(cd => ({
                complementoProdutoId: String(cd.complementoProdutoId),
                maxQtdePermitida: parseInt(cd.maxQtdePermitida) || 1
            })) : []
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
    let totalItens = 0;
    Object.values(cartData).forEach(item => {
        if (item && typeof item.qtde === 'number') {
            totalItens += item.qtde;
        }
    });
    cartCountEl.innerText = totalItens;
}
function displayCartItems() {
    console.log("[DISPLAY_CART] Iniciando displayCartItems. Dados atuais:", JSON.parse(JSON.stringify(cartData)));
    const container = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const checkoutSection = document.getElementById('checkoutSection');

    let missingElements = false;
    if (!container) {
        console.error("[DISPLAY_CART_ERROR] Elemento 'cartItemsContainer' NÃO encontrado no DOM!");
        missingElements = true;
    }
    if (!emptyCartMessage) {
        console.error("[DISPLAY_CART_ERROR] Elemento 'emptyCartMessage' NÃO encontrado no DOM!");
        missingElements = true;
    }
    if (!checkoutSection) {
        console.error("[DISPLAY_CART_ERROR] Elemento 'checkoutSection' NÃO encontrado no DOM!");
        missingElements = true;
    }

    if (missingElements) {
        console.warn("[DISPLAY_CART] Um ou mais elementos cruciais da UI do carrinho não foram encontrados. A renderização dos itens do carrinho foi pulada. Verifique os erros acima.");
        // Mesmo que alguns elementos não sejam encontrados, ainda podemos tentar atualizar o resumo se ele existir
        // ou outras partes, mas a lista de itens não será renderizada.
        // Para simplificar, vamos retornar se os elementos principais não estiverem lá.
        return;
    }

    console.log("[DISPLAY_CART] Todos os elementos base ('cartItemsContainer', 'emptyCartMessage', 'checkoutSection') foram encontrados.");

    // O restante da sua lógica de displayCartItems continua aqui...
    container.innerHTML = ''; // Limpa o container
    const idsProdutosPrincipais = Object.keys(cartData);

    if (idsProdutosPrincipais.length === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutSection.style.display = 'none'; // Esconde a seção de checkout se o carrinho estiver vazio
        updateCartSummary(0, 0); // Atualiza o resumo para R$ 0,00 e 0 itens.
        console.log("[DISPLAY_CART] Carrinho vazio, exibindo mensagem de carrinho vazio.");
        return;
    }

    emptyCartMessage.style.display = 'none';
    checkoutSection.style.display = 'block'; // Mostra a seção de checkout se houver itens

    let totalGeralCompra = 0;
    let totalItensPrincipaisDisplay = 0;

    idsProdutosPrincipais.forEach(idPrincipalStr => {
        const itemPrincipal = cartData[idPrincipalStr];
        if (!itemPrincipal || typeof itemPrincipal.preco !== 'number' || typeof itemPrincipal.qtde !== 'number') {
            console.warn(`[DISPLAY_CART] Item principal inválido (ID ${idPrincipalStr}), pulando renderização do item.`);
            return;
        }

        console.log(`[DISPLAY_CART] Renderizando item ${itemPrincipal.nome} (ID ${idPrincipalStr}) com quantidade: ${itemPrincipal.qtde}`);

        const subtotalItemPrincipal = itemPrincipal.preco * itemPrincipal.qtde;
        totalGeralCompra += subtotalItemPrincipal;
        totalItensPrincipaisDisplay += itemPrincipal.qtde;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row mb-3 p-3 border rounded bg-white shadow-sm';
        itemRow.innerHTML = `
            <div class="d-flex align-items-center border-bottom pb-2 mb-2">
                <img src="${itemPrincipal.imagem || PLACEHOLDER_IMAGE_CARRINHO}" alt="${itemPrincipal.nome || 'Produto'}" class="cart-item-img">
                <div class="flex-grow-1 cart-item-details ms-3">
                    <h5 class="mb-1">${itemPrincipal.nome || 'Produto Indisponível'}</h5>
                    <p class="text-muted mb-1 small">Unit.: R$ ${(itemPrincipal.preco || 0).toFixed(2)}</p>
                    <div class="d-flex align-items-center cart-item-actions mt-1">
                        <button class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="handleChangeQuantity('${idPrincipalStr}', ${itemPrincipal.qtde - 1})">-</button>
                        <input type="number" class="form-control form-control-sm mx-2" value="${itemPrincipal.qtde}" readonly style="width:60px; text-align:center;">
                        <button class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="handleChangeQuantity('${idPrincipalStr}', ${itemPrincipal.qtde + 1})">+</button>
                    </div>
                </div>
                <div class="text-end ms-3">
                    <p class="mb-1 cart-item-subtotal fw-bold">R$ ${subtotalItemPrincipal.toFixed(2)}</p>
                    <button class="btn btn-sm btn-danger mt-1" onclick="handleRemoveItem('${idPrincipalStr}')" title="Remover ${itemPrincipal.nome} e complementos"><i class="bi bi-trash3"></i> <span class="d-none d-md-inline">Tudo</span></button>
                </div>
            </div>`;

        if (Array.isArray(itemPrincipal.selectedComplements) && itemPrincipal.selectedComplements.length > 0) {
            const complementsContainer = document.createElement('div');
            complementsContainer.className = 'ms-md-4 mt-2 ps-md-2';
            itemPrincipal.selectedComplements.forEach(compItem => {
                if (!compItem || !compItem.produto || typeof compItem.produto.preco !== 'number' || typeof compItem.qtde !== 'number') {
                    console.warn(`[DISPLAY_CART] Complemento inválido para o item ${idPrincipalStr}, pulando renderização do complemento.`);
                    return;
                }
                const complemento = compItem.produto;
                const idComplementoStr = String(complemento.id);
                const qtdeComplemento = compItem.qtde;
                const subtotalComplemento = (complemento.preco || 0) * qtdeComplemento;
                totalGeralCompra += subtotalComplemento;

                let maxQtdePermitidaEsteComp = 99;
                const produtoPrincipalOriginalConfig = todosProdutosGlobaisParaCarrinho.find(p => p.id === idPrincipalStr);
                if (produtoPrincipalOriginalConfig && Array.isArray(produtoPrincipalOriginalConfig.complementosDisponiveis)) {
                    const configDoPrincipal = produtoPrincipalOriginalConfig.complementosDisponiveis.find(cd => cd.complementoProdutoId === idComplementoStr);
                    if (configDoPrincipal && typeof configDoPrincipal.maxQtdePermitida === 'number') {
                        maxQtdePermitidaEsteComp = configDoPrincipal.maxQtdePermitida;
                    }
                }

                console.log(`[DISPLAY_CART] Renderizando complemento ${complemento.nome} (ID ${idComplementoStr}) para ${itemPrincipal.nome} com quantidade: ${qtdeComplemento}`);

                const complementRow = document.createElement('div');
                complementRow.className = 'cart-complement-item d-flex align-items-center mb-2 py-2 border-bottom border-light';
                complementRow.innerHTML = `
                    <img src="${complemento.imagem || PLACEHOLDER_IMAGE_CARRINHO}" alt="${complemento.nome}" class="me-2" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                    <div class="flex-grow-1">
                        <small class="fw-semibold d-block">${complemento.nome} <span class="text-muted">(+R$ ${(complemento.preco || 0).toFixed(2)})</span></small>
                        <small class="text-muted">Qtde: ${qtdeComplemento} (Máx: ${maxQtdePermitidaEsteComp})</small>
                    </div>
                    <div class="d-flex align-items-center cart-item-actions mx-2">
                        <button class="btn btn-outline-secondary btn-xs py-0 px-1" onclick="handleChangeComplementQuantity('${idPrincipalStr}', '${idComplementoStr}', ${qtdeComplemento - 1})">-</button>
                        <input type="number" class="form-control form-control-sm mx-1" value="${qtdeComplemento}" readonly style="width:50px; text-align:center;">
                        <button class="btn btn-outline-secondary btn-xs py-0 px-1" onclick="handleChangeComplementQuantity('${idPrincipalStr}', '${idComplementoStr}', ${qtdeComplemento + 1})">+</button>
                    </div>
                    <div class="text-end" style="min-width:80px;">
                        <small class="cart-item-subtotal d-block fw-bold">R$ ${subtotalComplemento.toFixed(2)}</small>
                        <button class="btn btn-xs btn-outline-danger py-0 px-1" onclick="handleRemoveComplement('${idPrincipalStr}', '${idComplementoStr}')" title="Remover ${complemento.nome}"><i class="bi bi-x-circle"></i></button>
                    </div>`;
                complementsContainer.appendChild(complementRow);
            });
            itemRow.appendChild(complementsContainer);
        }
        container.appendChild(itemRow);
    });

    updateCartSummary(totalGeralCompra, totalItensPrincipaisDisplay);
    updateFinalizeButtonState();
    console.log("[DISPLAY_CART] displayCartItems concluído com sucesso.");
}

function updateCartSummary(totalGeral, totalItensPrincipais) {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;
    const textoItens = totalItensPrincipais === 1 ? "item principal" : "itens principais";
    summaryContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                Subtotal (${totalItensPrincipais} ${textoItens}):
                <span>R$ ${totalGeral.toFixed(2)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold" style="font-size: 1.1rem;">
                Total do Pedido:
                <span class="total-value" style="color: #ff5722;">R$ ${totalGeral.toFixed(2)}</span>
            </li>
        </ul>`;
}

// --- MANIPULAÇÃO DO CARRINHO ---
function handleChangeQuantity(idProdutoPrincipalStr, newQuantity) {
    const itemPrincipal = cartData[idProdutoPrincipalStr];
    // Log no início da função
    console.log(`[HANDLE_CHANGE_QTY] ID: ${idProdutoPrincipalStr}, Nova Qtde Desejada: ${newQuantity}, Qtde Atual no Carrinho: ${itemPrincipal?.qtde}`);

    if (!itemPrincipal) {
        console.warn(`[HANDLE_CHANGE_QTY] Item principal não encontrado para ID: ${idProdutoPrincipalStr}`);
        return;
    }

    newQuantity = parseInt(newQuantity); // Garante que é um número

    if (newQuantity <= 0) {
        console.log(`[HANDLE_CHANGE_QTY] Nova quantidade é ${newQuantity}. Removendo item ${idProdutoPrincipalStr}.`);
        handleRemoveItem(idProdutoPrincipalStr);
        return;
    }
    if (itemPrincipal.qtdeMax && newQuantity > itemPrincipal.qtdeMax) {
        console.warn(`[HANDLE_CHANGE_QTY] Limite de quantidade atingido para ${itemPrincipal.nome}. Máx: ${itemPrincipal.qtdeMax}, Desejado: ${newQuantity}`);
        Swal.fire('Limite Atingido!', `Qtd. máx. para "${itemPrincipal.nome}" é ${itemPrincipal.qtdeMax}.`, 'warning');
        // Importante: Não altera a quantidade e não salva se atingir o limite.
        // A UI não será atualizada para a quantidade inválida.
        // Se você quiser que o input volte ao valor máximo, teria que chamar displayCartItems aqui também,
        // ou ajustar o valor do input diretamente (o que é menos ideal com a sua estratégia de recriar tudo).
        return;
    }

    console.log(`[HANDLE_CHANGE_QTY] Atualizando qtde de ${itemPrincipal.nome} de ${itemPrincipal.qtde} para ${newQuantity}`);
    itemPrincipal.qtde = newQuantity;
    saveCartToStorageCarrinho(); // Salva e dispara a re-renderização
}

function handleRemoveItem(idProdutoPrincipalStr) {
    const itemRemovido = cartData[idProdutoPrincipalStr];
    if (!itemRemovido) return;

    console.log(`[HANDLE_REMOVE_ITEM] Removendo item ${itemRemovido.nome} (ID: ${idProdutoPrincipalStr})`);
    delete cartData[idProdutoPrincipalStr];
    Swal.fire('Removido!', `"${itemRemovido.nome}" e complementos removidos.`, 'success');
    saveCartToStorageCarrinho();
}

function handleChangeComplementQuantity(idPrincipalStr, idComplementoStr, novaQtde) {
    const itemPrincipal = cartData[idPrincipalStr];
    console.log(`[HANDLE_CHANGE_COMP_QTY] Item Principal: ${itemPrincipal?.nome}, Complemento ID: ${idComplementoStr}, Nova Qtde Desejada: ${novaQtde}`);

    if (!itemPrincipal || !Array.isArray(itemPrincipal.selectedComplements)) {
        console.warn(`[HANDLE_CHANGE_COMP_QTY] Item principal ou array de complementos não encontrado.`);
        return;
    }

    const indexComp = itemPrincipal.selectedComplements.findIndex(c => String(c.produto.id) === idComplementoStr);
    if (indexComp === -1) {
        console.warn(`[HANDLE_CHANGE_COMP_QTY] Complemento ID ${idComplementoStr} não encontrado no item ${itemPrincipal.nome}.`);
        return;
    }

    const complementoSelecionado = itemPrincipal.selectedComplements[indexComp];
    console.log(`[HANDLE_CHANGE_COMP_QTY] Complemento encontrado: ${complementoSelecionado.produto.nome}, Qtde Atual: ${complementoSelecionado.qtde}`);


    let maxQtdePermitidaConfigurada = 99;
    const produtoPrincipalOriginal = todosProdutosGlobaisParaCarrinho.find(p => p.id === idPrincipalStr);
    if (produtoPrincipalOriginal && Array.isArray(produtoPrincipalOriginal.complementosDisponiveis)) {
        const configDoPrincipal = produtoPrincipalOriginal.complementosDisponiveis.find(cd => cd.complementoProdutoId === idComplementoStr);
        if (configDoPrincipal && typeof configDoPrincipal.maxQtdePermitida === 'number') {
            maxQtdePermitidaConfigurada = configDoPrincipal.maxQtdePermitida;
        }
    }
    console.log(`[HANDLE_CHANGE_COMP_QTY] Máx. qtde permitida para ${complementoSelecionado.produto.nome}: ${maxQtdePermitidaConfigurada}`);

    novaQtde = parseInt(novaQtde);
    if (novaQtde <= 0) {
        console.log(`[HANDLE_CHANGE_COMP_QTY] Nova qtde é ${novaQtde}. Removendo complemento ${complementoSelecionado.produto.nome}.`);
        itemPrincipal.selectedComplements.splice(indexComp, 1);
    } else if (novaQtde > maxQtdePermitidaConfigurada) {
        console.warn(`[HANDLE_CHANGE_COMP_QTY] Limite de qtde atingido para complemento ${complementoSelecionado.produto.nome}. Máx: ${maxQtdePermitidaConfigurada}, Desejado: ${novaQtde}. Ajustando para o máximo.`);
        Swal.fire('Limite Atingido!', `Máximo de "${complementoSelecionado.produto.nome}" é ${maxQtdePermitidaConfigurada}.`, 'warning');
        itemPrincipal.selectedComplements[indexComp].qtde = maxQtdePermitidaConfigurada;
    } else {
        console.log(`[HANDLE_CHANGE_COMP_QTY] Atualizando qtde do complemento ${complementoSelecionado.produto.nome} para ${novaQtde}`);
        itemPrincipal.selectedComplements[indexComp].qtde = novaQtde;
    }
    saveCartToStorageCarrinho();
}

function handleRemoveComplement(idProdutoPrincipalStr, idComplementoStr) {
    const itemPrincipal = cartData[idProdutoPrincipalStr];
    if (!itemPrincipal || !Array.isArray(itemPrincipal.selectedComplements)) return;

    const compRemovido = itemPrincipal.selectedComplements.find(c => String(c.produto.id) === idComplementoStr);
    console.log(`[HANDLE_REMOVE_COMP] Removendo complemento ID ${idComplementoStr} do item ${itemPrincipal.nome}`);
    itemPrincipal.selectedComplements = itemPrincipal.selectedComplements.filter(c => String(c.produto.id) !== idComplementoStr);
    if (compRemovido) Swal.fire('Complemento Removido', `"${compRemovido.produto.nome}" removido.`, 'info');
    saveCartToStorageCarrinho();
}

// --- LÓGICA DE CLIENTE E FINALIZAÇÃO ---
// (Suas funções updateCustomerUI, formatPhoneNumber, formatCEP, fetchAddressFromViaCEP, 
// handleRegister, handleLogin, handleLogout, updateFinalizeButtonState, e finalizeOrder
// permanecem como na sua versão anterior. Cole-as aqui.)
// ... (COLE AQUI AS SUAS FUNÇÕES DE CLIENTE E FINALIZAÇÃO COMPLETAS) ...
// COPIEI AS FUNÇÕES PARA CÁ PARA O EXEMPLO SER COMPLETO:
function updateCustomerUI() {
    const loggedInDiv = document.getElementById('loggedInCustomer');
    const guestDiv = document.getElementById('guestCustomer');
    const customerNameEl = document.getElementById('customerName');
    const customerDetailsEl = document.getElementById('customerDetails');

    if (!loggedInDiv || !guestDiv || !customerNameEl || !customerDetailsEl) {
        console.warn("Elementos da UI do cliente não encontrados.");
        return;
    }

    if (loggedInCustomerData) {
        customerNameEl.textContent = loggedInCustomerData.nome || 'Cliente';
        if (loggedInCustomerData.endereco && loggedInCustomerData.endereco.cep) {
            const addr = loggedInCustomerData.endereco;
            customerDetailsEl.innerHTML = `<small><strong>Tel:</strong> ${loggedInCustomerData.telefone ? formatPhoneNumber(loggedInCustomerData.telefone) : 'N/A'}<br><strong>End:</strong> ${addr.logradouro || ''}, ${addr.numero || ''} ${addr.complemento ? ' (' + addr.complemento + ')' : ''}<br>${addr.bairro || ''} - ${addr.cidade || ''}/${addr.estado || ''}<br><strong>CEP:</strong> ${addr.cep ? formatCEP(addr.cep) : ''} ${addr.referencia ? `<br><strong>Ref:</strong> ${addr.referencia}` : ''}</small>`;
            customerDetailsEl.style.display = 'block';
        } else {
            customerDetailsEl.innerHTML = '<small><em>Endereço não cadastrado. Complete seu cadastro para finalizar o pedido.</em></small>';
            customerDetailsEl.style.display = 'block';
        }
        loggedInDiv.style.display = 'flex';
        guestDiv.style.display = 'none';
    } else {
        loggedInDiv.style.display = 'none';
        guestDiv.style.display = 'block';
        customerDetailsEl.style.display = 'none';
    }
    updateFinalizeButtonState();
}
function formatPhoneNumber(p) { const c = ('' + p).replace(/\D/g, ''); const m = c.match(/^(\d{2})(\d{4,5})(\d{4})$/); return m ? `(${m[1]}) ${m[2]}-${m[3]}` : p; }
function formatCEP(c) { const cl = ('' + c).replace(/\D/g, ''); if (cl.length === 8) { const m = cl.match(/^(\d{5})(\d{3})$/); if (m) return `${m[1]}-${m[2]}`; } return c; }
async function fetchAddressFromViaCEP(cep) {
    const cleanCep = cep.replace(/\D/g, ''); if (cleanCep.length !== 8) { Swal.showValidationMessage(`CEP inválido. Deve conter 8 dígitos.`); return null; }
    try {
        Swal.showLoading(); const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`); if (!response.ok) throw new Error('Erro ao buscar CEP. Verifique a conexão.'); const data = await response.json(); if (data.erro) throw new Error('CEP não localizado.'); return data;
    } catch (error) { Swal.showValidationMessage(`${error.message}`); return null; } finally { Swal.hideLoading(); }
}
async function handleRegister() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Crie sua Conta',
        html: `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto; padding-right: 15px;">
                <label for="swal-input-name-reg" class="swal2-label">Nome Completo:</label><input id="swal-input-name-reg" class="swal2-input" placeholder="Seu nome completo" required>
                <label for="swal-input-phone-reg" class="swal2-label">Telefone:</label><input id="swal-input-phone-reg" class="swal2-input" placeholder="(XX) XXXXX-XXXX" type="tel" required>
                <hr class="my-3"><h5>Endereço de Entrega</h5>
                <label for="swal-input-cep-reg" class="swal2-label">CEP:</label><div class="input-group mb-2"><input id="swal-input-cep-reg" class="form-control swal2-input" placeholder="Apenas números" type="tel" maxlength="9" required style="border-right:0; flex-grow:1;"><button type="button" id="swal-button-buscar-cep" class="btn btn-outline-secondary" style="border-color: #d9d9d9;"><i class="bi bi-search"></i></button></div>
                <label for="swal-input-logradouro-reg" class="swal2-label">Endereço (Rua, Av.):</label><input id="swal-input-logradouro-reg" class="swal2-input mb-2" placeholder="Preenchido automaticamente" readonly required>
                <div class="row g-2 mb-2"><div class="col-sm-6"><label for="swal-input-numero-reg" class="swal2-label">Número:</label><input id="swal-input-numero-reg" class="swal2-input" placeholder="Nº" required></div><div class="col-sm-6"><label for="swal-input-complemento-reg" class="swal2-label">Complemento:</label><input id="swal-input-complemento-reg" class="swal2-input" placeholder="Apto, Bloco..."></div></div>
                <label for="swal-input-bairro-reg" class="swal2-label">Bairro:</label><input id="swal-input-bairro-reg" class="swal2-input mb-2" placeholder="Preenchido automaticamente" readonly required>
                <div class="row g-2 mb-2"><div class="col-sm-8"><label for="swal-input-cidade-reg" class="swal2-label">Cidade:</label><input id="swal-input-cidade-reg" class="swal2-input" placeholder="Preenchido automaticamente" readonly required></div><div class="col-sm-4"><label for="swal-input-estado-reg" class="swal2-label">UF:</label><input id="swal-input-estado-reg" class="swal2-input" placeholder="UF" readonly required></div></div>
                <label for="swal-input-referencia-reg" class="swal2-label">Ponto de Referência:</label><input id="swal-input-referencia-reg" class="swal2-input mb-2" placeholder="Opcional">
                <hr class="my-3"><h5>Dados de Acesso</h5>
                <label for="swal-input-email-reg" class="swal2-label">E-mail:</label><input id="swal-input-email-reg" class="swal2-input mb-2" placeholder="Seu e-mail para login" type="email" required>
                <label for="swal-input-password-reg" class="swal2-label">Senha:</label><input id="swal-input-password-reg" class="swal2-input" placeholder="Crie uma senha (mín. 6 caracteres)" type="password" required>
            </div>`,
        focusConfirm: false, width: '90%', customClass: { label: 'form-label text-start d-block mb-1 mt-2', input: 'form-control form-control-sm', htmlContainer: 'swal2-html-container-custom' },
        confirmButtonText: 'Cadastrar e Entrar <i class="bi bi-check-circle"></i>', confirmButtonColor: '#28a745', showCancelButton: true, cancelButtonText: 'Cancelar',
        didOpen: () => {
            const cepInput = document.getElementById('swal-input-cep-reg');
            const buscarCepBtn = document.getElementById('swal-button-buscar-cep');
            const logInput = document.getElementById('swal-input-logradouro-reg');
            const bairroInput = document.getElementById('swal-input-bairro-reg');
            const cidInput = document.getElementById('swal-input-cidade-reg');
            const estInput = document.getElementById('swal-input-estado-reg');
            const numInput = document.getElementById('swal-input-numero-reg');
            cepInput.addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8); e.target.value = v.substring(0, 9); });
            const fillAddr = (d) => { logInput.value = d.logradouro || ''; bairroInput.value = d.bairro || ''; cidInput.value = d.localidade || ''; estInput.value = d.uf || '';[logInput, bairroInput, cidInput, estInput].forEach(i => i.readOnly = !!i.value); if (d.logradouro || d.bairro) numInput.focus(); else logInput.focus(); };
            const cepSearch = async () => { const c = cepInput.value.replace(/\D/g, ''); if (c.length !== 8) { Swal.showValidationMessage('CEP deve ter 8 dígitos.'); return; } Swal.showLoading(); const addrData = await fetchAddressFromViaCEP(c); Swal.hideLoading(); if (addrData) fillAddr(addrData); else[logInput, bairroInput, cidInput, estInput].forEach(i => { i.value = ''; i.readOnly = false; }); };
            if (buscarCepBtn) buscarCepBtn.addEventListener('click', cepSearch);
            cepInput.addEventListener('blur', async () => { const c = cepInput.value.replace(/\D/g, ''); if (c.length === 8 && (!logInput.value || logInput.readOnly === false)) await cepSearch(); });
            const phoneInput = document.getElementById('swal-input-phone-reg');
            phoneInput.addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 11) v = v.substring(0, 11); if (v.length > 10) { v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); } else if (v.length > 6) { v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); } else if (v.length > 2) { v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2'); } else { v = v.replace(/^(\d*)/, '($1'); } e.target.value = v; });
        },
        preConfirm: () => {
            const getV = (id) => document.getElementById(id)?.value || ''; const n = getV('swal-input-name-reg').trim(), t = getV('swal-input-phone-reg').replace(/\D/g, ''), c = getV('swal-input-cep-reg').replace(/\D/g, ''), l = getV('swal-input-logradouro-reg').trim(), num = getV('swal-input-numero-reg').trim(), comp = getV('swal-input-complemento-reg').trim(), b = getV('swal-input-bairro-reg').trim(), cid = getV('swal-input-cidade-reg').trim(), est = getV('swal-input-estado-reg').trim(), ref = getV('swal-input-referencia-reg').trim(), e = getV('swal-input-email-reg').trim(), p = getV('swal-input-password-reg');
            let errs = [];
            if (!n) errs.push("Nome");
            if (!t || t.length < 10 || t.length > 11) errs.push("Telefone (10 ou 11 dígitos)");
            if (!c || c.length !== 8) errs.push("CEP (8 dígitos)");
            if (!l) errs.push("Endereço (Rua/Av.)");
            if (!num) errs.push("Número do endereço");
            if (!b) errs.push("Bairro");
            if (!cid) errs.push("Cidade");
            if (!est) errs.push("UF");
            if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errs.push("E-mail válido");
            if (!p || p.length < 6) errs.push("Senha (mínimo 6 caracteres)");
            if (errs.length > 0) { Swal.showValidationMessage(`Campos inválidos ou faltando: ${errs.join(', ')}.`); return false; }
            return { nome: n, telefone: t, email: e, password: p, endereco: { cep: c, logradouro: l, numero: num, complemento: comp, bairro: b, cidade: cid, estado: est, referencia: ref } };
        }
    });

    if (isConfirmed && formValues) {
        loggedInCustomerData = { id: 'user-' + Date.now(), nome: formValues.nome, email: formValues.email, telefone: formValues.telefone, endereco: formValues.endereco };
        saveCustomerToStorageCarrinho(loggedInCustomerData);
        updateCustomerUI();
        Swal.fire('Cadastro Realizado!', 'Bem-vindo(a)! Você já está logado(a).', 'success');
    }
}
async function handleLogin() {
    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Entrar na sua Conta',
        html: '<input id="swal-input-email" class="swal2-input" placeholder="Seu e-mail" type="email" style="margin-bottom:0.5em;"><input id="swal-input-password" class="swal2-input" placeholder="Sua senha" type="password">',
        focusConfirm: false, confirmButtonText: 'Entrar <i class="bi bi-arrow-right-circle"></i>', confirmButtonColor: '#ff5722', showCancelButton: true, cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const email = document.getElementById('swal-input-email').value;
            const password = document.getElementById('swal-input-password').value;
            if (!email || !password) { Swal.showValidationMessage(`E-mail e senha são obrigatórios.`); return false; }
            const potentialCustomer = getCustomerFromStorageCarrinho();
            if (potentialCustomer && potentialCustomer.email === email) {
                return { customerData: potentialCustomer };
            }
            Swal.showValidationMessage(`E-mail não cadastrado ou senha inválida.`);
            return false;
        }
    });
    if (isConfirmed && formValues) {
        loggedInCustomerData = formValues.customerData;
        saveCustomerToStorageCarrinho(loggedInCustomerData);
        updateCustomerUI();
        Swal.fire('Bem-vindo(a) de volta!', 'Login realizado com sucesso!', 'success');
    }
}
function handleLogout() {
    Swal.fire({
        title: 'Sair da conta?', text: "Você precisará fazer login novamente para finalizar um pedido no futuro.", icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, sair', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc3545',
    }).then((result) => { if (result.isConfirmed) { removeCustomerFromStorageCarrinho(); loggedInCustomerData = null; updateCustomerUI(); Swal.fire("Desconectado", "Você saiu da sua conta.", "info"); } });
}
function updateFinalizeButtonState() {
    const finalizeBtn = document.getElementById('finalizeOrderButton'); if (!finalizeBtn) return;
    const idsPrincipais = Object.keys(cartData);
    const addrCompleto = loggedInCustomerData && loggedInCustomerData.endereco && loggedInCustomerData.endereco.logradouro && loggedInCustomerData.endereco.numero && loggedInCustomerData.endereco.bairro && loggedInCustomerData.endereco.cidade && loggedInCustomerData.endereco.estado && loggedInCustomerData.endereco.cep;
    finalizeBtn.disabled = !(idsPrincipais.length > 0 && loggedInCustomerData && addrCompleto);
    if (finalizeBtn.disabled) {
        if (idsPrincipais.length === 0) { finalizeBtn.title = "Seu carrinho está vazio. Adicione itens para continuar."; }
        else if (!loggedInCustomerData) { finalizeBtn.title = "Você precisa estar logado para finalizar o pedido."; }
        else if (!addrCompleto) { finalizeBtn.title = "Seu endereço de entrega está incompleto. Por favor, atualize seu cadastro."; }
    } else { finalizeBtn.title = "Prosseguir para o pagamento."; }
}
async function finalizeOrder() {
    if (Object.keys(cartData).length === 0) { Swal.fire('Carrinho Vazio!', 'Adicione itens ao seu carrinho antes de finalizar.', 'warning'); return; }
    if (!loggedInCustomerData) { Swal.fire('Identifique-se!', 'Por favor, entre na sua conta ou cadastre-se para continuar.', 'info'); return; }
    if (!loggedInCustomerData.endereco || !loggedInCustomerData.endereco.logradouro || !loggedInCustomerData.endereco.numero || !loggedInCustomerData.endereco.bairro || !loggedInCustomerData.endereco.cidade || !loggedInCustomerData.endereco.estado || !loggedInCustomerData.endereco.cep) {
        Swal.fire('Endereço Incompleto!', 'Seu endereço de entrega parece incompleto. Por favor, verifique seu cadastro.', 'warning'); return;
    }
    const formaPagamentoSelecionada = document.querySelector('input[name="formaPagamento"]:checked');
    if (!formaPagamentoSelecionada) { Swal.fire('Atenção!', 'Por favor, selecione uma forma de pagamento.', 'warning'); return; }
    const pedidoItensPayload = [];
    Object.values(cartData).forEach(itemPrincipal => {
        if (itemPrincipal && itemPrincipal.id && typeof itemPrincipal.qtde === 'number' && typeof itemPrincipal.preco === 'number') {
            pedidoItensPayload.push({ produtoId: itemPrincipal.id, quantidade: itemPrincipal.qtde, precoUnitario: itemPrincipal.preco, });
            if (Array.isArray(itemPrincipal.selectedComplements)) {
                itemPrincipal.selectedComplements.forEach(compItem => {
                    if (compItem && compItem.produto && compItem.produto.id && typeof compItem.qtde === 'number' && typeof compItem.produto.preco === 'number') {
                        pedidoItensPayload.push({ produtoId: compItem.produto.id, quantidade: compItem.qtde, precoUnitario: compItem.produto.preco, });
                    }
                });
            }
        }
    });
    if (pedidoItensPayload.length === 0) { Swal.fire('Carrinho com Itens Inválidos!', 'Não foi possível processar os itens do carrinho. Tente novamente.', 'warning'); return; }
    const payload = { clienteId: loggedInCustomerData.id, enderecoEntrega: loggedInCustomerData.endereco, itens: pedidoItensPayload, formaPagamento: formaPagamentoSelecionada.value, };
    Swal.fire({ title: 'Confirmando seu pedido...', text: 'Aguarde um momento.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        console.log("Enviando payload do pedido:", JSON.stringify(payload, null, 2));
        const response = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status} ao enviar o pedido.` })); throw new Error(errorData.message || `Falha ao enviar pedido. Código: ${response.status}`); }
        const data = await response.json();
        Swal.fire('Pedido Enviado!', `Seu pedido nº ${data.id || '(não informado)'} foi registrado com sucesso!`, 'success').then(() => { cartData = {}; saveCartToStorageCarrinho(); window.location.href = 'Pedidos.html'; });
    } catch (err) { console.error("Erro ao finalizar pedido:", err); Swal.fire('Ops, algo deu errado!', `Não foi possível registrar seu pedido: ${err.message}`, 'error'); }
}


// --- INICIALIZAÇÃO DA PÁGINA DO CARRINHO ---
window.onload = async () => {
    console.log("carrinho.js: window.onload iniciado.");
    cartData = getCartFromStorageCarrinho();
    console.log("carrinho.js: Carrinho carregado do localStorage:", JSON.parse(JSON.stringify(cartData)));

    loggedInCustomerData = getCustomerFromStorageCarrinho();
    await carregarTodosProdutosParaReferenciaCarrinho();

    updateCartCountNavbarCarrinho();
    displayCartItems();
    updateCustomerUI();

    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const registerBtn = document.getElementById('registerButton');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const finalizeBtn = document.getElementById('finalizeOrderButton');
    if (finalizeBtn) finalizeBtn.addEventListener('click', finalizeOrder);

    console.log("carrinho.js: window.onload concluído.");
};