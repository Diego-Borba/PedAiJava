// src/main/resources/static/js/pdv.js
document.addEventListener('DOMContentLoaded', function () {
    let venda = {
        itens: [],
        pagamentos: [],
        desconto: 0,
        acrescimo: 0,
        clienteId: null, // ID do cliente selecionado
    };
    let quantidadeMultiplicador = 1;
    let todosOsProdutos = [];
    let itemSelecionadoIndex = null;

    // --- Seletores de Elementos DOM ---
    const produtoSearch = $('#produto-search');
    const clienteSearch = $('#cliente-search'); // Novo seletor de cliente
    const tabelaVendaBody = document.getElementById('tabela-venda').querySelector('tbody');
    const totalEl = document.getElementById('total-venda');
    const btnFinalizarVenda = document.getElementById('btnFinalizarVenda');
    const btnCancelarVenda = document.getElementById('btnCancelarVenda');
    const btnImportarPedido = document.getElementById('btnImportarPedido');
    const btnDesconto = document.getElementById('btn-desconto');
    const btnAcrescimo = document.getElementById('btn-acrescimo');
    const multiplicadorBadge = document.getElementById('multiplicador-badge');

    // --- Containers Desktop ---
    const categoryButtonsContainer = document.getElementById('category-buttons-container');
    const productListContainer = document.getElementById('product-list-container');

    // --- Containers Mobile ---
    const categoryCardsContainerMobile = document.getElementById('category-cards-container-mobile');
    const productListContainerMobile = document.getElementById('product-list-container-mobile');


    // --- Inicialização ---
    async function inicializarPdv() {
        try {
            const response = await fetchWithAuth('/api/produtos/cardapio');
            if (!response.ok) throw new Error('Falha ao carregar produtos');
            todosOsProdutos = await response.json();
            
            // Renderiza o navegador de desktop
            renderizarCategorias();
            renderizarProdutos('Todos');
            
            // Renderiza o navegador mobile
            renderizarMobileBrowser();
            renderizarProdutosMobile('Todos');

        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível carregar o navegador de produtos.', 'error');
        }
        resetarVenda();
    }

    // --- Configuração do Select2 para Cliente ---
    clienteSearch.select2({
        theme: 'bootstrap-5',
        placeholder: 'Selecione o cliente (Opcional para venda à vista)',
        allowClear: true,
        ajax: {
            url: '/api/clientes/search',
            dataType: 'json',
            delay: 250,
            transport: select2AuthTransport,
            data: (params) => ({ q: params.term }),
        },
        language: "pt-BR"
    }).on('select2:select', function (e) {
        venda.clienteId = parseInt(e.params.data.id);
    }).on('select2:clear', function (e) {
        venda.clienteId = null;
    });

    // --- Configuração do Select2 para Produto ---
    produtoSearch.select2({
        theme: 'bootstrap-5',
        placeholder: 'Pesquisar produto (F2)',
        minimumInputLength: 2,
        ajax: {
            url: '/api/produtos/search',
            dataType: 'json',
            delay: 250,
            transport: function (params, success, failure) {
                const urlWithQuery = `${params.url}?q=${params.data.q || ''}`;
                fetchWithAuth(urlWithQuery)
                    .then(response => response.json())
                    .then(data => success({ results: data }))
                    .catch(() => failure());
            },
            data: (params) => ({ q: params.term }),
        },
        language: "pt-BR"
    }).on('select2:select', function (e) {
        const produtoId = e.params.data.id;
        const produtoCompleto = todosOsProdutos.find(p => p.id == produtoId);

        if (produtoCompleto) {
            adicionarItemVenda(produtoCompleto, quantidadeMultiplicador);
            produtoSearch.val(null).trigger('change');
            resetarMultiplicador();
            produtoSearch.select2('close');
        } else {
            fetchWithAuth(`/api/produtos/${produtoId}`)
                .then(response => response.json())
                .then(produto => {
                    adicionarItemVenda(produto, quantidadeMultiplicador);
                    produtoSearch.val(null).trigger('change');
                    resetarMultiplicador();
                    produtoSearch.select2('close');
                });
        }
    });

    // --- Navegador de Produtos (Desktop) ---
    function renderizarCategorias() {
        if (!categoryButtonsContainer) return; 
        const categorias = ['Todos', ...new Set(todosOsProdutos.map(p => p.categoria).filter(Boolean))];
        categoryButtonsContainer.innerHTML = '';
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-buttons .btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderizarProdutos(cat);
            });
            categoryButtonsContainer.appendChild(btn);
        });
        if (categoryButtonsContainer.firstChild) {
            categoryButtonsContainer.firstChild.classList.add('active');
        }
    }

    function renderizarProdutos(categoria) {
        if (!productListContainer) return;
        productListContainer.innerHTML = '';
        const produtosFiltrados = categoria === 'Todos'
            ? todosOsProdutos.filter(p => p.vendidoIndividualmente)
            : todosOsProdutos.filter(p => p.categoria === categoria && p.vendidoIndividualmente);

        produtosFiltrados.sort((a, b) => (a.ordemVisualizacao || 999) - (b.ordemVisualizacao || 999));

        produtosFiltrados.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'product-card-pdv';
            const imagemSrc = (produto.imagem && produto.imagemTipo)
                ? `data:${produto.imagemTipo};base64,${produto.imagem}`
                : 'https://via.placeholder.com/150';

            card.innerHTML = `
                <div class="img-container">
                    <img src="${imagemSrc}" alt="${produto.nome}">
                </div>
                <div class="info">
                    <div class="nome">${produto.nome}</div>
                    <div class="preco">R$ ${produto.preco.toFixed(2)}</div>
                </div>
            `;
            card.addEventListener('click', () => adicionarItemVenda(produto, quantidadeMultiplicador));
            productListContainer.appendChild(card);
        });
    }

    // --- Navegador Mobile ---
    function renderizarMobileBrowser() {
        if (!categoryCardsContainerMobile) return;

        const categorias = ['Todos', ...new Set(todosOsProdutos.map(p => p.categoria).filter(Boolean))];
        categoryCardsContainerMobile.innerHTML = '';

        categorias.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card-mobile';
            card.textContent = cat;
            card.dataset.categoria = cat;
            card.addEventListener('click', () => {
                document.querySelectorAll('.category-card-mobile').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                renderizarProdutosMobile(cat);
            });
            categoryCardsContainerMobile.appendChild(card);
        });

        if (categoryCardsContainerMobile.firstChild) {
            categoryCardsContainerMobile.firstChild.classList.add('active');
        }
    }
    
    function renderizarProdutosMobile(categoria) {
        if (!productListContainerMobile) return; 
        
        productListContainerMobile.innerHTML = '';
        const produtosFiltrados = categoria === 'Todos'
            ? todosOsProdutos.filter(p => p.vendidoIndividualmente)
            : todosOsProdutos.filter(p => p.categoria === categoria && p.vendidoIndividualmente);

        produtosFiltrados.sort((a, b) => (a.ordemVisualizacao || 999) - (b.ordemVisualizacao || 999));

        produtosFiltrados.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'product-card-pdv-mobile';
            
            let imgHtml = '<div class="img-container"><img src="https://via.placeholder.com/120x80" alt="Sem Imagem"></div>'; 
            if (produto.imagem && produto.imagemTipo) {
                 imgHtml = `
                 <div class="img-container">
                    <img src="data:${produto.imagemTipo};base64,${produto.imagem}" alt="${produto.nome}">
                 </div>`;
            }

            card.innerHTML = `
                ${imgHtml}
                <div class="info">
                    <div class="nome">${produto.nome}</div>
                    <div class="preco">R$ ${produto.preco.toFixed(2)}</div>
                </div>
            `;
            card.addEventListener('click', () => adicionarItemVenda(produto, quantidadeMultiplicador));
            productListContainerMobile.appendChild(card);
        });
    }


    // --- Funções da Venda ---
    function adicionarItemVenda(produto, quantidade = 1) {
        if (produto.isKit) {
            Swal.fire('Atenção', 'Kits ainda não podem ser adicionados diretamente pelo PDV.', 'warning');
            return;
        }
        const itemExistente = venda.itens.find(item => item.id === produto.id);
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            const produtoCompleto = todosOsProdutos.find(p => p.id === produto.id) || produto;
            venda.itens.push({ ...produtoCompleto, quantidade: quantidade });
        }
        renderizarVenda();
        resetarMultiplicador();
    }

    function renderizarVenda() {
        tabelaVendaBody.innerHTML = '';
        itemSelecionadoIndex = null;
        venda.itens.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            tr.innerHTML = `
                <td>${item.nome}</td>
                <td><input type="number" class="form-control form-control-sm" value="${item.quantidade}" data-index="${index}"></td>
                <td>R$ ${item.preco.toFixed(2)}</td>
                <td>R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" data-index="${index}"><i class="bi bi-trash"></i></button></td>
            `;
            tabelaVendaBody.appendChild(tr);
        });
        calcularTotais();
    }

    function calcularTotais() {
        const subtotal = venda.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const total = subtotal - venda.desconto + venda.acrescimo;
        
        totalEl.textContent = `R$ ${total.toFixed(2)}`;

        btnFinalizarVenda.disabled = venda.itens.length === 0;
    }

    function resetarVenda() {
        venda = { itens: [], pagamentos: [], desconto: 0, acrescimo: 0, clienteId: null };
        renderizarVenda();
        resetarMultiplicador();
        clienteSearch.val(null).trigger('change'); // Limpa o Select2 do cliente
    }

    function resetarMultiplicador() {
        quantidadeMultiplicador = 1;
        multiplicadorBadge.style.display = 'none';
        multiplicadorBadge.textContent = '';
    }

    // --- Event Listeners ---
    tabelaVendaBody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;

        const button = e.target.closest('button');
        if (button) {
            const index = button.dataset.index;
            venda.itens.splice(index, 1);
            renderizarVenda();
        } else {
            document.querySelectorAll('#tabela-venda tbody tr').forEach(row => row.classList.remove('table-info'));
            tr.classList.add('table-info');
            itemSelecionadoIndex = parseInt(tr.dataset.index);
            tr.querySelector('input').focus();
            tr.querySelector('input').select();
        }
    });

    tabelaVendaBody.addEventListener('change', (e) => {
        if (e.target.type === 'number') {
            const index = e.target.dataset.index;
            const novaQuantidade = parseInt(e.target.value);
            if (novaQuantidade > 0) {
                venda.itens[index].quantidade = novaQuantidade;
            } else {
                venda.itens.splice(index, 1);
            }
            renderizarVenda();
        }
    });

    btnCancelarVenda.addEventListener('click', () => {
        if (venda.itens.length > 0) {
            Swal.fire({
                title: 'Deseja cancelar a venda?',
                text: "Todos os itens e pagamentos serão removidos.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, cancelar',
                cancelButtonText: 'Não'
            }).then((result) => {
                if (result.isConfirmed) {
                    resetarVenda();
                }
            });
        } else {
            resetarVenda();
        }
    });

    async function aplicarValor(tipo) {
        const { value: valor } = await Swal.fire({
            title: `Aplicar ${tipo}`,
            input: 'number',
            inputLabel: `Valor do ${tipo}`,
            inputValue: 0,
            showCancelButton: true,
            inputValidator: (value) => {
                if (value === null || value < 0) {
                    return 'Por favor, insira um valor válido!'
                }
            }
        });

        if (valor) {
            if (tipo === 'Desconto') {
                venda.desconto = parseFloat(valor);
            } else if (tipo === 'Acréscimo') {
                venda.acrescimo = parseFloat(valor);
            }
            calcularTotais();
        }
    }

    btnDesconto.addEventListener('click', () => aplicarValor('Desconto'));
    btnAcrescimo.addEventListener('click', () => aplicarValor('Acréscimo'));

    btnFinalizarVenda.addEventListener('click', abrirModalFinalizarVenda);

    btnImportarPedido.addEventListener('click', async () => {
        try {
            const response = await fetchWithAuth('/api/pedidos/importar');
            if (!response.ok) throw new Error('Não foi possível buscar os pedidos.');
            const pedidos = await response.json();

            if (pedidos.length === 0) {
                Swal.fire('Nenhum Pedido', 'Não há pedidos para retirada ou encomenda disponíveis para importação.', 'info');
                return;
            }

            const inputOptions = pedidos.reduce((acc, pedido) => {
                acc[pedido.id] = `#${pedido.id} - ${pedido.clienteNome} (R$ ${pedido.total.toFixed(2)})`;
                return acc;
            }, {});

            const { value: pedidoId } = await Swal.fire({
                title: 'Importar Pedido',
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Selecione um pedido',
                showCancelButton: true,
            });

            if (pedidoId) {
                const pedidoSelecionado = pedidos.find(p => p.id == pedidoId);
                resetarVenda();
                pedidoSelecionado.itens.forEach(item => {
                    const produtoOriginal = todosOsProdutos.find(p => p.id === item.produtoId);
                    if (produtoOriginal) {
                        adicionarItemVenda(produtoOriginal, item.quantidade);
                    }
                });
                // TODO: Importar cliente também se necessário? Por enquanto mantém lógica padrão
            }
        } catch (err) {
            Swal.fire('Erro', err.message, 'error');
        }
    });

    // --- Lógica dos Atalhos de Teclado ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2' && !Swal.isVisible()) {
            e.preventDefault();
            produtoSearch.select2('open');
        }

        if (e.key === 'F12' && !Swal.isVisible()) {
            e.preventDefault();
            abrirModalFinalizarVenda();
        }

        const isTypingNumber = document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number';
        if (isTypingNumber) return;

        if (e.key === '*') {
            e.preventDefault();
            const activeEl = document.activeElement;
            const valor = parseInt(activeEl.value);

            if (activeEl.tagName === 'INPUT' && !isNaN(valor) && valor > 0) {
                quantidadeMultiplicador = valor;
                multiplicadorBadge.textContent = `x${quantidadeMultiplicador}`;
                multiplicadorBadge.style.display = 'block';
                activeEl.value = '';
            }
        }

        if (itemSelecionadoIndex !== null && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                venda.itens[itemSelecionadoIndex].quantidade++;
                renderizarVenda();
            }
            if (e.key === '-') {
                e.preventDefault();
                if (venda.itens[itemSelecionadoIndex].quantidade > 1) {
                    venda.itens[itemSelecionadoIndex].quantidade--;
                } else {
                    venda.itens.splice(itemSelecionadoIndex, 1);
                }
                renderizarVenda();
            }
        }
    });

    // --- Modal de Finalização (F12) e Impressão ---
    async function abrirModalFinalizarVenda() {
        if (venda.itens.length === 0) {
            Swal.fire('Atenção', 'Adicione itens à venda para finalizar.', 'warning');
            return;
        }

        const subtotal = venda.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const totalVenda = subtotal - venda.desconto + venda.acrescimo;
        
        const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'Finalizar Venda',
            html: `
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-12 col-md-7">
                            <h5>Pagamentos</h5>
                            <div class="input-group mb-3">
                                <select class="form-select" id="swal-forma-pagamento" style="flex: 2;">
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Pix">Pix</option>
                                    <option value="Cartao_Credito">Cartão de Crédito</option>
                                    <option value="Cartao_Debito">Cartão de Débito</option>
                                    <option value="A_Prazo" style="font-weight: bold; color: #d63384;">A Prazo (Crediário)</option>
                                </select>
                                <input type="number" class="form-control" id="swal-valor-pago" placeholder="0,00" style="flex: 1;">
                                <button class="btn btn-success" id="swal-btn-add-pagamento"><i class="bi bi-plus-lg"></i></button>
                            </div>
                             <ul class="list-group" id="swal-lista-pagamentos" style="max-height: 150px; overflow-y: auto;"></ul>
                        </div>
                        <div class="col-12 col-md-5 border-start mt-3 mt-md-0">
                            <h5>Resumo</h5>
                            <div class="d-flex justify-content-between"><span>Subtotal:</span> <span>R$ ${subtotal.toFixed(2)}</span></div>
                            <div class="d-flex justify-content-between text-danger"><span>Desconto:</span> <span>- R$ ${venda.desconto.toFixed(2)}</span></div>
                            <div class="d-flex justify-content-between text-success"><span>Acréscimo:</span> <span>+ R$ ${venda.acrescimo.toFixed(2)}</span></div>
                            <hr>
                            <div class="d-flex justify-content-between fw-bold fs-5"><span>Total:</span> <span>R$ ${totalVenda.toFixed(2)}</span></div>
                            <hr>
                            <div class="d-flex justify-content-between"><span>Total Pago:</span> <strong id="swal-total-pago" class="text-success">R$ 0.00</strong></div>
                            <div class="d-flex justify-content-between"><span>Restante:</span> <strong id="swal-restante" class="text-danger">R$ ${totalVenda.toFixed(2)}</strong></div>
                            <div class="d-flex justify-content-between"><span>Troco:</span> <strong id="swal-troco" class="text-primary">R$ 0.00</strong></div>
                        </div>
                    </div>
                </div>`,
            width: '800px',
            showConfirmButton: true,
            confirmButtonText: 'Finalizar Venda',
            showCancelButton: true,
            cancelButtonText: 'Voltar',
            didOpen: () => {
                const modalPagamentos = [...venda.pagamentos];
                const swalForma = document.getElementById('swal-forma-pagamento');
                const swalValor = document.getElementById('swal-valor-pago');
                const swalBtnAdd = document.getElementById('swal-btn-add-pagamento');
                const swalLista = document.getElementById('swal-lista-pagamentos');
                const swalTotalPago = document.getElementById('swal-total-pago');
                const swalRestante = document.getElementById('swal-restante');
                const swalTroco = document.getElementById('swal-troco');

                const updateTotal = () => {
                    const totalPago = modalPagamentos.reduce((acc, p) => acc + p.valor, 0);
                    const restante = totalVenda - totalPago;
                    swalTotalPago.textContent = `R$ ${totalPago.toFixed(2)}`;
                    swalRestante.textContent = `R$ ${Math.max(0, restante).toFixed(2)}`;
                    swalTroco.textContent = `R$ ${Math.max(0, -restante).toFixed(2)}`;
                    swalValor.value = Math.max(0, restante).toFixed(2);
                    Swal.getConfirmButton().disabled = restante > 0.01;
                };

                const updateLista = () => {
                    swalLista.innerHTML = '';
                    modalPagamentos.forEach((p, index) => {
                        swalLista.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center list-group-item-sm">${p.forma.replace('_', ' ')}: R$ ${p.valor.toFixed(2)} <button class="btn btn-sm btn-outline-danger py-0 px-1" data-index="${index}"><i class="bi bi-x"></i></button></li>`;
                    });
                    updateTotal();
                };

                const adicionarPagamentoHandler = () => {
                    const valor = parseFloat(swalValor.value);
                    if (valor > 0) {
                        modalPagamentos.push({ forma: swalForma.value, valor: valor });
                        updateLista();
                    }
                };

                swalBtnAdd.addEventListener('click', adicionarPagamentoHandler);
                swalValor.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarPagamentoHandler();
                    }
                });

                swalLista.addEventListener('click', (e) => {
                    if (e.target.closest('button')) {
                        const index = e.target.closest('button').dataset.index;
                        modalPagamentos.splice(index, 1);
                        updateLista();
                    }
                });
                updateLista();
            },
            preConfirm: () => {
                const modalPagamentos = [];
                document.querySelectorAll('#swal-lista-pagamentos li').forEach(li => {
                    const [forma, valorStr] = li.textContent.split(': R$ ');
                    modalPagamentos.push({ forma: forma.trim().replace(' ', '_'), valor: parseFloat(valorStr) });
                });

                // --- VALIDAÇÃO DE A PRAZO ---
                const temVendaAPrazo = modalPagamentos.some(p => p.forma === 'A_Prazo');
                
                // Se tiver venda a prazo e o cliente for nulo OU se o clienteId for 1 (Assumindo 1 como Consumidor Final padrão sem cadastro real)
                // Nota: venda.clienteId é null se não selecionado no Select2. Se o sistema usa 1 por padrão, ajuste a lógica abaixo.
                // A lógica atual: Obrigatório selecionar um cliente no Select2 (venda.clienteId != null)
                if (temVendaAPrazo && !venda.clienteId) {
                    Swal.showValidationMessage('Para vendas "A Prazo", é OBRIGATÓRIO selecionar um cliente cadastrado!');
                    return false;
                }

                return { pagamentos: modalPagamentos };
            }
        });

        if (isConfirmed && formValues) {
            venda.pagamentos = formValues.pagamentos;
            
            // Se clienteId for nulo (não selecionado), define como 1 (Consumidor Final) para o backend processar vendas normais
            // Se for A Prazo, a validação acima garantiu que não é nulo.
            const clienteFinal = venda.clienteId ? venda.clienteId : 1;

            // Montar o DTO para enviar ao backend
            const vendaPayload = {
                ...venda,
                clienteId: clienteFinal, 
                subtotal: subtotal,
                total: totalVenda,
                itens: venda.itens.map(item => ({ id: item.id, quantidade: item.quantidade })),
            };

            try {
                const response = await fetchWithAuth('/api/vendas/registrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(vendaPayload),
                });
                if (!response.ok) throw new Error('Falha ao registrar a venda no servidor.');

                const result = await Swal.fire({
                    title: 'Venda Registrada!',
                    text: 'Deseja imprimir um comprovante?',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: '<i class="bi bi-receipt"></i> Cupom',
                    cancelButtonText: 'Não, Concluir',
                    showDenyButton: true,
                    denyButtonText: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                });

                if (result.isConfirmed) {
                    imprimirCupomVenda(venda);
                } else if (result.isDenied) {
                    imprimirPdfVenda(venda);
                }

                resetarVenda();

            } catch (error) {
                Swal.fire('Erro!', error.message, 'error');
            }
        }
    }

    function imprimirCupomVenda(venda) {
        const subtotal = venda.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const total = subtotal - venda.desconto + venda.acrescimo;
        const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);

        const itensText = venda.itens.map(item => `${item.quantidade} x ${item.nome}\n          R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n`).join('');

        const conteudo = `
            <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 5px;">
                <h3 style="text-align: center; margin:0;">PedAi</h3>
                <p style="text-align: center; margin:0;">Comprovante de Venda</p>
                <p>Data: ${new Date().toLocaleString('pt-br')}</p>
                <hr style="border-style: dashed;">
                <pre style="white-space: pre-wrap; margin:0;">${itensText}</pre>
                <hr style="border-style: dashed;">
                <p style="text-align: right;">Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}</p>
                ${venda.desconto > 0 ? `<p style="text-align: right;">Desconto: - R$ ${venda.desconto.toFixed(2).replace('.', ',')}</p>` : ''}
                ${venda.acrescimo > 0 ? `<p style="text-align: right;">Acréscimo: + R$ ${venda.acrescimo.toFixed(2).replace('.', ',')}</p>` : ''}
                <h4 style="text-align: right;">Total: R$ ${total.toFixed(2).replace('.', ',')}</h4>
                <hr style="border-style: dashed;">
                 ${venda.pagamentos.map(p => `<p style="text-align: right;">${p.forma.replace('_', ' ')}: R$ ${p.valor.toFixed(2).replace('.', ',')}</p>`).join('')}
                <p style="text-align: right;">Troco: R$ ${Math.max(0, totalPago - total).toFixed(2).replace('.', ',')}</p>
            </div>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Cupom</title></head><body style="margin:0;">${conteudo}</body><script>setTimeout(() => { window.print(); window.close(); }, 250);</script></html>`);
        printWindow.document.close();
    }

    async function imprimirPdfVenda(venda) {
        const subtotal = venda.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const total = subtotal - venda.desconto + venda.acrescimo;

        const payload = {
            itens: venda.itens.map(i => ({
                nome: i.nome,
                quantidade: i.quantidade,
                precoUnitario: i.preco,
            })),
            subtotal: subtotal,
            desconto: venda.desconto,
            acrescimo: venda.acrescimo,
            total: total,
            pagamentos: venda.pagamentos,
        };

        try {
            const response = await fetchWithAuth('/api/vendas/imprimir-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Falha ao gerar o PDF.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    }

    // --- Inicialização da Tela ---
    inicializarPdv();
});