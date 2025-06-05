// static/js/pedidos.js
let todosProdutos = []; // Cache global de todos os produtos da API, processados e normalizados.
let cart = {};          // Objeto que armazena o carrinho de compras em memória nesta página.

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi'; // Imagem padrão.
const CART_STORAGE_KEY = 'pedAiCart'; // Chave para o carrinho no localStorage (consistente com carrinho.js).

// --- GERENCIAMENTO DO CARRINHO (LOCALSTORAGE) ---

/**
 * @description Carrega os dados do carrinho do localStorage.
 * @returns {object} O objeto do carrinho parseado ou um objeto vazio se não existir ou em caso de erro.
 */
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

/**
 * @description Salva os dados atuais do carrinho (da variável global `cart`) no localStorage.
 */
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Nota: A UI específica desta página (pedidos.js) é atualizada conforme necessário,
    // mas a renderização completa do carrinho (como em carrinho.js) não ocorre aqui.
}

// --- UI HELPERS ---

/**
 * @description Mostra ou esconde um indicador de carregamento.
 * @param {boolean} show - True para mostrar, false para esconder.
 */
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = show ? 'block' : 'none';
}

/**
 * @description Atualiza o contador de itens do carrinho na barra de navegação.
 * Soma as quantidades de todos os itens principais no carrinho (`cart`).
 */
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

/**
 * @description Mostra um "toast" (notificação breve) informando que um produto foi adicionado.
 * @param {object} produto - O objeto do produto adicionado.
 * @param {boolean} [isComplemento=false] - True se o produto é um complemento.
 */
function showProdutoAdicionadoToast(produto, isComplemento = false) {
    const title = isComplemento ? `${produto.nome} (complemento) adicionado!` : `${produto.nome} adicionado!`;
    Swal.fire({
        title: title,
        html: `
            <div class="text-center">
                <img src="${produto.imagem || PLACEHOLDER_IMAGE}" alt="${produto.nome}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; border: 2px solid #ff5722;">
                <p class="mb-0">Adicionado ao seu carrinho.</p>
            </div>`,
        icon: 'success',
        toast: true,
        position: 'bottom-end', // Posição do toast
        showConfirmButton: false,
        timer: 2000, // Duração do toast em milissegundos
        timerProgressBar: true,
        showCloseButton: true
    });
}

// --- CARREGAMENTO E PROCESSAMENTO DE PRODUTOS ---

/**
 * @description Carrega os produtos da API, processa-os (normalizando campos)
 * e armazena na variável global `todosProdutos`.
 * Em seguida, carrega as categorias e exibe os produtos.
 */
async function carregarEProcessarProdutosAPI() {
    showLoadingIndicator(true);
    try {
        const response = await axios.get('/api/produtos');
        todosProdutos = response.data.map(p => {
            // Normalização para determinar se é um complemento.
            const ehComplemento = p.isComplemento === true || p.complemento === true;
            return {
                ...p,
                id: String(p.id), // Garante que o ID seja uma string.
                isComplemento: ehComplemento,
                permiteComplementos: p.permiteComplementos === true,
                ativo: p.ativo !== false, // Ativo por padrão, a menos que explicitamente false.
                qtdeMax: parseInt(p.qtdeMax) || 99, // Quantidade máxima padrão.
                complementosDisponiveis: Array.isArray(p.complementosDisponiveis) ? p.complementosDisponiveis.map(cd => ({
                    complementoProdutoId: String(cd.complementoProdutoId), // ID do produto que é o complemento.
                    maxQtdePermitida: parseInt(cd.maxQtdePermitida) || 1 // Máx. padrão de 1 por tipo de complemento.
                })) : []
            };
        });

        console.log("--- TODOS OS PRODUTOS PROCESSADOS (pedidos.js) ---", todosProdutos);
        // Exemplo de log para depuração (pode ser removido em produção)
        // const molhoMaioneseNormalizado = todosProdutos.find(p => p.nome && p.nome.toUpperCase().includes("MAIONESE"));
        // if (molhoMaioneseNormalizado) {
        //     console.log("MOLHO MAIONESE (Normalizado em pedidos.js) DETALHES:", JSON.stringify(molhoMaioneseNormalizado, null, 2));
        // }

        await carregarCategoriasVisiveis(); // Carrega e exibe os botões de categoria.
        filtrarEExibirProdutosCardapio('todos'); // Exibe inicialmente produtos de "todas" as categorias.
    } catch (err) {
        console.error('Erro fatal ao carregar/processar produtos da API (pedidos.js):', err);
        const container = document.getElementById('produtosContainer');
        if (container) container.innerHTML = '<p class="text-danger text-center col-12">Falha ao carregar produtos. Tente recarregar a página.</p>';
    } finally {
        showLoadingIndicator(false);
    }
}

/**
 * @description Cria e exibe os botões de filtro por categoria.
 * As categorias são extraídas dos produtos carregados que são principais e ativos.
 */
async function carregarCategoriasVisiveis() {
    const container = document.getElementById('categoryButtons');
    if (!container) { console.warn("Elemento 'categoryButtons' não encontrado em pedidos.js."); return; }
    container.innerHTML = ''; // Limpa botões existentes.

    try {
        // Filtra produtos para obter categorias: apenas produtos principais (não complementos) e ativos.
        const produtosParaCategorias = todosProdutos.filter(p => !p.isComplemento && p.ativo);
        // Extrai categorias únicas e não vazias, depois ordena.
        const categoriasUnicas = [...new Set(produtosParaCategorias.map(p => p.categoria).filter(cat => cat && String(cat).trim() !== ""))];
        categoriasUnicas.sort((a, b) => String(a).localeCompare(String(b)));

        // Botão "Todos"
        const todosBtn = document.createElement('button');
        todosBtn.className = 'btn btn-outline-primary active me-2 mb-2'; // 'active' por padrão.
        todosBtn.textContent = 'Todos';
        todosBtn.onclick = () => {
            document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
            todosBtn.classList.add('active');
            filtrarEExibirProdutosCardapio('todos');
        };
        container.appendChild(todosBtn);

        // Botões para cada categoria
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

/**
 * @description Filtra os produtos com base na categoria selecionada e os exibe no cardápio.
 * @param {string} categoriaSelecionada - A categoria para filtrar (ou "todos").
 */
function filtrarEExibirProdutosCardapio(categoriaSelecionada) {
    console.log(`FILTRANDO CARDÁPIO (pedidos.js) para categoria: '${categoriaSelecionada}'`);
    showLoadingIndicator(true); // Mostra loading rapidamente para feedback visual.
    
    // Usamos setTimeout para permitir que o indicador de loading renderize antes do processamento pesado.
    setTimeout(() => {
        // Filtra apenas produtos principais (isComplemento === false) e ativos (ativo === true).
        const produtosParaCardapio = todosProdutos.filter(p => {
            const naoEhComplemento = p.isComplemento === false;
            const estaAtivo = p.ativo === true;
            return naoEhComplemento && estaAtivo;
        });

        let produtosFiltradosPorCategoria = produtosParaCardapio;
        if (categoriaSelecionada !== 'todos') {
            // Filtra pela categoria específica, ignorando case.
            produtosFiltradosPorCategoria = produtosParaCardapio.filter(p =>
                p.categoria && String(p.categoria).toLowerCase() === String(categoriaSelecionada).toLowerCase()
            );
        }
        
        console.log(`  Total produtos para cardápio (categoria '${categoriaSelecionada}'): ${produtosFiltradosPorCategoria.length}`);
        // console.log("  Nomes dos produtos que SERÃO exibidos:", produtosFiltradosPorCategoria.map(p => ({nome: p.nome, isComplemento: p.isComplemento, ativo: p.ativo})));

        // Ordena os produtos para exibição (opcional, por ordem de visualização ou nome).
        produtosFiltradosPorCategoria.sort((a, b) =>
            (a.ordemVisualizacao ?? Infinity) - (b.ordemVisualizacao ?? Infinity) ||
            (a.nome || '').localeCompare(b.nome || '')
        );

        renderizarCardsProdutos(produtosFiltradosPorCategoria); // Renderiza os cards dos produtos filtrados.
        showLoadingIndicator(false);
    }, 50); // Pequeno delay.
}

/**
 * @description Renderiza os cards dos produtos no container da página.
 * @param {Array<object>} listaDeProdutosCardapio - Lista de produtos a serem exibidos.
 */
function renderizarCardsProdutos(listaDeProdutosCardapio) {
    const container = document.getElementById('produtosContainer');
    if (!container) { console.error("Container 'produtosContainer' não encontrado em pedidos.js."); return; }
    container.innerHTML = ''; // Limpa o container.

    if (listaDeProdutosCardapio.length === 0) {
        container.innerHTML = '<p class="text-center col-12 mt-5">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    listaDeProdutosCardapio.forEach(produto => {
        const card = document.createElement('div');
        // Define classes para responsividade (Bootstrap)
        card.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex align-items-stretch';
        card.innerHTML = `
            <div class="card produto-card h-100 shadow-sm">
                <div class="card-img-top-wrapper">
                    <img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome || 'Produto'}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome || 'Produto Sem Nome'}</h5>
                    <p class="card-text descricao small text-muted">${produto.descricao || 'Sem descrição disponível.'}</p>
                    ${produto.categoria ? `<p class="card-text categoria small"><span class="badge bg-secondary">${produto.categoria}</span></p>` : ''}
                    <p class="preco fw-bold fs-5 mt-auto mb-2">R$ ${(produto.preco != null ? produto.preco : 0).toFixed(2)}</p>
                    <button class="btn btn-add-carrinho w-100"><i class="bi bi-cart-plus me-2"></i>Adicionar</button>
                </div>
            </div>`;
        // Adiciona evento de clique ao botão "Adicionar" do card.
        card.querySelector('.btn-add-carrinho').addEventListener('click', () => handleProdutoPrincipalClick(produto));
        container.appendChild(card);
    });
}

// --- LÓGICA DE ADIÇÃO AO CARRINHO E MODAL DE COMPLEMENTOS ---

/**
 * @description Manipula o clique em um produto principal para adicioná-lo ao carrinho.
 * Se o produto já existe no carrinho, incrementa a quantidade.
 * Se permite complementos, abre o modal de complementos.
 * @param {object} produtoPrincipal - O objeto do produto principal clicado.
 */
function handleProdutoPrincipalClick(produtoPrincipal) {
    console.log("handleProdutoPrincipalClick (pedidos.js) para:", produtoPrincipal.nome, produtoPrincipal);
    const produtoPrincipalIdStr = String(produtoPrincipal.id);

    if (cart[produtoPrincipalIdStr]) { // Se o produto já está no carrinho
        if (cart[produtoPrincipalIdStr].qtde >= (produtoPrincipal.qtdeMax || 99)) {
            Swal.fire('Limite Atingido!', `Quantidade máxima para "${produtoPrincipal.nome}" já atingida no carrinho.`, 'warning');
            return;
        }
        cart[produtoPrincipalIdStr].qtde++; // Incrementa a quantidade.
    } else { // Se é um novo produto no carrinho
        cart[produtoPrincipalIdStr] = {
            ...produtoPrincipal, // Copia todas as propriedades do produto.
            id: produtoPrincipalIdStr, // Garante que o ID no carrinho seja string.
            qtde: 1,
            selectedComplements: [] // Inicializa array para complementos selecionados.
        };
    }
    showProdutoAdicionadoToast(produtoPrincipal); // Mostra notificação.

    // Verifica se o produto permite complementos e se há complementos disponíveis.
    if (produtoPrincipal.permiteComplementos && Array.isArray(produtoPrincipal.complementosDisponiveis) && produtoPrincipal.complementosDisponiveis.length > 0) {
        console.log(`Produto "${produtoPrincipal.nome}" permite complementos. Abrindo modal (pedidos.js).`);
        prepararEMostrarModalComplementos(produtoPrincipal);
    } else {
        console.log(`Produto "${produtoPrincipal.nome}" não tem complementos ou não permite (pedidos.js).`);
        saveCartToStorage(); // Salva o carrinho no localStorage.
        updateCartCountNavbar(); // Atualiza o contador na navbar.
    }
}

/**
 * @description Prepara e exibe o modal para seleção de complementos de um produto principal.
 * @param {object} produtoPrincipal - O produto principal para o qual os complementos serão adicionados.
 */
function prepararEMostrarModalComplementos(produtoPrincipal) {
    const produtoPrincipalIdStr = String(produtoPrincipal.id);
    console.log(`Preparando modal de complementos para: ${produtoPrincipal.nome} (ID: ${produtoPrincipalIdStr}) em pedidos.js`);

    // Referências aos elementos do modal.
    const modalElement = document.getElementById('complementosModal');
    const modalTitle = document.getElementById('complementosModalLabel');
    const principalProductNameModal = document.getElementById('principalProductNameModal');
    const complementosListContainer = document.getElementById('complementosListContainer');
    const btnSalvarComplementos = document.getElementById('btnSalvarComplementos');

    if (!modalElement || !modalTitle || !principalProductNameModal || !complementosListContainer || !btnSalvarComplementos) {
        console.error("Elementos do modal de complementos não encontrados em pedidos.js.");
        saveCartToStorage(); // Salva o estado atual do carrinho mesmo se o modal falhar.
        updateCartCountNavbar();
        return;
    }

    modalTitle.textContent = `Adicionar Complementos para:`;
    principalProductNameModal.textContent = produtoPrincipal.nome;
    complementosListContainer.innerHTML = ''; // Limpa lista de complementos anterior.
    modalElement.dataset.principalId = produtoPrincipalIdStr; // Armazena o ID do principal no modal.

    const itemPrincipalNoCarrinho = cart[produtoPrincipalIdStr];
    // Complementos já selecionados para este item (se houver, para preencher o modal).
    const complementosJaSelecionados = (itemPrincipalNoCarrinho && Array.isArray(itemPrincipalNoCarrinho.selectedComplements)) ? itemPrincipalNoCarrinho.selectedComplements : [];

    if (!Array.isArray(produtoPrincipal.complementosDisponiveis) || produtoPrincipal.complementosDisponiveis.length === 0) {
        complementosListContainer.innerHTML = '<p class="text-muted text-center p-3">Sem complementos disponíveis para este item.</p>';
    } else {
        produtoPrincipal.complementosDisponiveis.forEach(configComp => {
            const idComplementoConfigStr = String(configComp.complementoProdutoId);
            // Busca os detalhes do produto complemento na lista global `todosProdutos`.
            // Garante que o complemento também esteja ativo.
            const produtoComplementoDetalhes = todosProdutos.find(p => p.id === idComplementoConfigStr && p.ativo);

            if (produtoComplementoDetalhes) {
                const inputId = `comp-qty-${produtoPrincipalIdStr}-${produtoComplementoDetalhes.id}`;
                let qtdAtualNoModal = 0;
                // Verifica se este complemento já foi selecionado anteriormente para este item principal.
                const compJaNoCarrinho = complementosJaSelecionados.find(cs => String(cs.produto.id) === idComplementoConfigStr);
                if (compJaNoCarrinho) qtdAtualNoModal = compJaNoCarrinho.qtde;

                const maxPermitido = configComp.maxQtdePermitida; // Máximo permitido para este complemento específico.

                const divCompItem = document.createElement('div');
                divCompItem.className = 'complemento-item d-flex justify-content-between align-items-center mb-3 p-3 border rounded shadow-sm bg-light';
                divCompItem.innerHTML = `
                    <div class="me-3"><img src="${produtoComplementoDetalhes.imagem || PLACEHOLDER_IMAGE}" alt="${produtoComplementoDetalhes.nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.25rem;"></div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${produtoComplementoDetalhes.nome}</h6>
                        <small class="text-muted">R$ ${(produtoComplementoDetalhes.preco != null ? produtoComplementoDetalhes.preco : 0).toFixed(2)}</small>
                        <small class="d-block text-primary fw-bold">Máximo permitido: ${maxPermitido}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <button type="button" class="btn btn-sm btn-outline-secondary comp-qty-change" data-action="decrease" data-target-input-id="${inputId}">-</button>
                        <input type="number" id="${inputId}" class="form-control form-control-sm mx-2 comp-qty-input" value="${qtdAtualNoModal}" min="0" data-complement-id="${idComplementoConfigStr}" data-max-qty="${maxPermitido}" style="width: 70px; text-align: center;" readonly>
                        <button type="button" class="btn btn-sm btn-outline-secondary comp-qty-change" data-action="increase" data-target-input-id="${inputId}">+</button>
                    </div>`;
                complementosListContainer.appendChild(divCompItem);
            } else {
                console.warn(`  - Complemento ID ${idComplementoConfigStr} (listado para ${produtoPrincipal.nome}) não encontrado em 'todosProdutos' ou está inativo (pedidos.js).`);
            }
        });
    }

    // Adiciona eventos aos botões +/- de quantidade dos complementos no modal.
    complementosListContainer.querySelectorAll('.comp-qty-change').forEach(button => {
        button.addEventListener('click', function() {
            ajustarQtdeComplementoModal(this.dataset.targetInputId, this.dataset.action === 'increase' ? 1 : -1);
        });
    });

    // Recria o listener do botão salvar para evitar duplicidade e garantir o ID correto do principal.
    const novoBtnSalvar = btnSalvarComplementos.cloneNode(true); // Clona para remover listeners antigos.
    btnSalvarComplementos.parentNode.replaceChild(novoBtnSalvar, btnSalvarComplementos);
    novoBtnSalvar.addEventListener('click', () => salvarComplementosDoModal(produtoPrincipalIdStr));

    // Exibe o modal Bootstrap.
    const bootstrapModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}

/**
 * @description Ajusta a quantidade de um complemento no input do modal.
 * @param {string} inputId - O ID do input de quantidade do complemento.
 * @param {number} delta - A variação na quantidade (+1 para aumentar, -1 para diminuir).
 */
function ajustarQtdeComplementoModal(inputId, delta) {
    const inputElement = document.getElementById(inputId);
    if (!inputElement) return;
    const maxQtde = parseInt(inputElement.dataset.maxQty);
    let currentValue = parseInt(inputElement.value);
    let newValue = currentValue + delta;

    if (newValue < 0) newValue = 0; // Não permite quantidade negativa.
    if (newValue > maxQtde) newValue = maxQtde; // Não excede o máximo permitido.
    inputElement.value = newValue;
}

/**
 * @description Salva os complementos selecionados no modal para o item principal no carrinho.
 * @param {string} idProdutoPrincipalStr - O ID do produto principal.
 */
function salvarComplementosDoModal(idProdutoPrincipalStr) {
    const itemPrincipalNoCarrinho = cart[idProdutoPrincipalStr];
    if (!itemPrincipalNoCarrinho) {
        Swal.fire('Erro!', 'Produto principal não encontrado no carrinho (pedidos.js).', 'error');
        return;
    }

    const novosSelectedComplements = [];
    // Coleta as quantidades dos inputs de complemento no modal.
    document.querySelectorAll('#complementosListContainer .comp-qty-input').forEach(input => {
        const quantidade = parseInt(input.value);
        if (quantidade > 0) { // Apenas adiciona se a quantidade for maior que zero.
            const idComplementoStr = String(input.dataset.complementId);
            const produtoComplementoDetalhes = todosProdutos.find(p => p.id === idComplementoStr);
            if (produtoComplementoDetalhes) {
                novosSelectedComplements.push({
                    produto: { // Armazena uma cópia simplificada dos dados do complemento.
                        id: produtoComplementoDetalhes.id,
                        nome: produtoComplementoDetalhes.nome,
                        preco: produtoComplementoDetalhes.preco,
                        imagem: produtoComplementoDetalhes.imagem,
                        // isComplemento: true // Pode ser útil para identificar no carrinho.js
                    },
                    qtde: quantidade
                });
                showProdutoAdicionadoToast(produtoComplementoDetalhes, true); // Toast para cada complemento adicionado
            }
        }
    });
    itemPrincipalNoCarrinho.selectedComplements = novosSelectedComplements;
    console.log("Complementos salvos para o item (pedidos.js):", itemPrincipalNoCarrinho.nome, itemPrincipalNoCarrinho.selectedComplements);

    saveCartToStorage(); // Salva o carrinho (com os complementos atualizados) no localStorage.
    updateCartCountNavbar(); // Atualiza o contador na navbar.

    // Fecha o modal de complementos.
    const modalElement = document.getElementById('complementosModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
    if (bootstrapModal) bootstrapModal.hide();

    Swal.fire('Complementos Salvos!', `Os complementos para "${itemPrincipalNoCarrinho.nome}" foram atualizados no carrinho.`, 'success');
}

// --- INICIALIZAÇÃO DA PÁGINA ---
window.onload = () => {
    console.log("pedidos.js: window.onload iniciado.");
    cart = getCartFromStorage(); // Carrega o carrinho do localStorage ao iniciar a página.
    updateCartCountNavbar(); // Atualiza o contador da navbar com os itens do carrinho.
    carregarEProcessarProdutosAPI(); // Carrega, processa e exibe os produtos da API.
    console.log("pedidos.js: window.onload concluído.");
};