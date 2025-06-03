// static/js/pedidos.js
let produtos = [];
let cart = {}; // { produtoId: { ...produto, qtde: X } }

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x150.png?text=PedAi';
const CART_STORAGE_KEY = 'pedAiCart';

// --- Funções de Gerenciamento do Carrinho no LocalStorage ---
function getCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : {};
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// --- Funções da UI da Página de Pedidos ---
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'block' : 'none';
    }
}

function updateCartCountNavbar() {
    const cartCountEl = document.getElementById('cartCountNavbar');
    if (!cartCountEl) return;

    let totalItensNoCarrinho = 0;
    Object.values(cart).forEach(item => {
        totalItensNoCarrinho += item.qtde;
    });
    cartCountEl.innerText = totalItensNoCarrinho;
}

function adicionarAoCarrinho(produto) {
    if (cart[produto.id]) {
        if (cart[produto.id].qtde < produto.qtdeMax) {
            cart[produto.id].qtde++;
        } else {
            Swal.fire({
                title: 'Limite Atingido!',
                text: `Você já adicionou a quantidade máxima permitida para "${produto.nome}".`,
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            return;
        }
    } else {
        cart[produto.id] = { ...produto, qtde: 1 };
    }
    saveCartToStorage();
    updateCartCountNavbar();

    Swal.fire({
        title: `${produto.nome} adicionado!`,
        html: `
            <div class="text-center">
                <img src="${produto.imagem || PLACEHOLDER_IMAGE}" alt="${produto.nome}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; border: 2px solid #ff5722;">
                <p class="mb-0">Adicionado ao seu carrinho.</p>
            </div>
        `,
        icon: 'success',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        showCloseButton: true
    });
}

async function carregarCategorias() {
    try {
        const response = await axios.get('/api/produtos/categorias');
        const categorias = response.data.filter(cat => cat !== null && cat.trim() !== "");
        const container = document.getElementById('categoryButtons');
        if (!container) return;
        container.innerHTML = ''; // Limpa botões antigos

        const todosBtn = document.createElement('button');
        todosBtn.className = 'btn btn-outline-primary active'; // Começa com "Todos" ativo
        todosBtn.textContent = 'Todos';
        todosBtn.onclick = () => {
            filtrarProdutos('todos');
            document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
            todosBtn.classList.add('active');
        };
        container.appendChild(todosBtn);

        categorias.sort((a, b) => a.localeCompare(b)); // Ordena categorias alfabeticamente
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary';
            btn.textContent = cat;
            btn.onclick = () => {
                filtrarProdutos(cat);
                document.querySelectorAll('#categoryButtons .btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            container.appendChild(btn);
        });
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        const container = document.getElementById('categoryButtons');
        if (container) container.innerHTML = '<p class="text-danger text-center">Não foi possível carregar as categorias.</p>';
    }
}

async function carregarProdutos() {
    showLoadingIndicator(true);
    const container = document.getElementById('produtosContainer');
    try {
        const response = await axios.get('/api/produtos');
        produtos = response.data;
        // Ordena os produtos pela ordem de visualização e depois pelo nome
        produtos.sort((a, b) => {
            const ordemA = a.ordemVisualizacao !== null && a.ordemVisualizacao !== undefined ? a.ordemVisualizacao : Infinity;
            const ordemB = b.ordemVisualizacao !== null && b.ordemVisualizacao !== undefined ? b.ordemVisualizacao : Infinity;
            if (ordemA === ordemB) {
                return (a.nome || '').localeCompare(b.nome || '');
            }
            return ordemA - ordemB;
        });
        exibirProdutos(produtos); // Exibe todos os produtos inicialmente
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        if (container) container.innerHTML = '<p class="text-danger text-center col-12">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>';
    } finally {
        showLoadingIndicator(false);
    }
}

function exibirProdutos(lista) {
    const container = document.getElementById('produtosContainer');
    if (!container) return;
    container.innerHTML = ''; // Limpa cards antigos

    if (lista.length === 0 && document.getElementById('loadingIndicator').style.display === 'none') {
        container.innerHTML = '<p class="text-center col-12 mt-5">Nenhum produto encontrado nesta categoria. Experimente outra!</p>';
        return;
    }

    lista.forEach(produto => {
        const card = document.createElement('div');        
        card.className = 'col-12 col-md-6 col-lg-3 col-xl-3 mb-4 d-flex align-items-stretch';
        card.innerHTML = `
            <div class="card produto-card h-100">
                <div class="card-img-top-wrapper">
                    <img src="${produto.imagem || PLACEHOLDER_IMAGE}" class="card-img-top" alt="${produto.nome || 'Produto'}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${produto.nome || 'Produto Sem Nome'}</h5>
                    <p class="card-text descricao">${produto.descricao || 'Sem descrição disponível.'}</p>
                    <p class="card-text categoria">
                        <small>Categoria: ${produto.categoria || 'Não categorizado'}</small>
                    </p>
                    <p class="preco">R$ ${(produto.preco !== null && produto.preco !== undefined ? produto.preco : 0).toFixed(2)}</p>
                    <button class="btn btn-add-carrinho w-100 mt-auto" onclick='adicionarAoCarrinho(${JSON.stringify(produto)})'>
                        <i class="bi bi-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

function filtrarProdutos(categoria) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    // Só filtra se não estiver carregando
    if (loadingIndicator && loadingIndicator.style.display !== 'none') {
        return;
    }
    showLoadingIndicator(true); // Mostra o indicador durante a filtragem (rápido, mas bom feedback)

    // Pequeno delay para o indicador ser visível e a UI parecer mais responsiva
    setTimeout(() => {
        let filtrados;
        if (categoria === 'todos') {
            filtrados = produtos;
        } else {
            filtrados = produtos.filter(produto => produto.categoria && produto.categoria.toLowerCase() === categoria.toLowerCase());
        }
        exibirProdutos(filtrados);
        showLoadingIndicator(false);
    }, 50); // 50ms é geralmente suficiente
}

// Inicialização da página
window.onload = () => {
    cart = getCartFromStorage();
    updateCartCountNavbar();
    carregarCategorias();      // Carrega as categorias primeiro
    carregarProdutos();        // Depois carrega os produtos
};