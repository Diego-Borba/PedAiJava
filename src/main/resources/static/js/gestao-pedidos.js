document.addEventListener('DOMContentLoaded', function () {

    try {
        const filtroModal = new bootstrap.Modal(document.getElementById('filtroModal'));
        const contaReceberModal = new bootstrap.Modal(document.getElementById('contaReceberModal'));
        const visualizacaoModal = new bootstrap.Modal(document.getElementById('visualizacaoModal'));

        const abas = { 'ENTREGA': 'pills-entregas', 'RETIRADA': 'pills-retiradas', 'ENCOMENDA': 'pills-encomendas' };
        let pedidoParaGerarConta = null;
        const clienteSelect = $('#contaClienteSelect').select2({ theme: 'bootstrap-5', dropdownParent: $('#contaReceberModal'), placeholder: 'Busque por um cliente' });

        carregarTodosOsPedidos(getTodaysDateFilter());

        Object.keys(abas).forEach(tipo => {
            const tabElement = document.getElementById(`${abas[tipo]}-tab`);
            if (tabElement) {
                tabElement.addEventListener('shown.bs.tab', () => carregarPedidosPorTipo(tipo, getFiltros()));
            }
        });

        document.getElementById('btnAbrirFiltros').addEventListener('click', () => filtroModal.show());
        document.getElementById('btnAplicarFiltros').addEventListener('click', aplicarFiltros);
        document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);
        document.getElementById('formContaReceber').addEventListener('submit', salvarContaReceber);

        async function carregarTodosOsPedidos(filtros) { const promises = Object.keys(abas).map(tipo => carregarPedidosPorTipo(tipo, filtros)); await Promise.all(promises); }
        async function carregarPedidosPorTipo(tipo, filtros) {
            const idAba = abas[tipo]; const container = document.getElementById(idAba); const contador = document.getElementById(`count-${tipo.toLowerCase()}s`);
            if (!container || !contador) return;
            container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
            try {
                const params = new URLSearchParams({ tipo, ...filtros });
                const response = await fetchWithAuth(`/api/pedidos/por-tipo?${params.toString()}`);
                if (!response.ok) throw new Error('Falha ao carregar pedidos.');

                const pedidos = await response.json();
                container.innerHTML = ''; contador.textContent = pedidos.length;
                if (pedidos.length === 0) { container.innerHTML = `<div class="text-center p-5 bg-light rounded mt-3"><p class="mb-0 text-muted">Nenhum pedido encontrado para hoje.</p></div>`; return; }
                const row = document.createElement('div'); row.className = 'row g-4';
                pedidos.forEach(pedido => row.appendChild(criarCardPedido(pedido)));
                container.appendChild(row);
            } catch (error) { container.innerHTML = `<div class="alert alert-danger">Erro ao carregar pedidos.</div>`; console.error("Erro na API:", error); }
        }

        function criarCardPedido(pedido) {
            const col = document.createElement('div');
            col.className = 'col-xl-3 col-lg-4 col-md-6 col-sm-12';
            const dataPedidoFormatada = new Date(pedido.dataPedido).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const dataAgendamentoFormatada = pedido.dataAgendamento ? new Date(pedido.dataAgendamento).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
            const pedidoString = JSON.stringify(pedido).replace(/'/g, "&apos;");
            col.innerHTML = `
                <div class="card pedido-card ${pedido.tipo === 'ENCOMENDA' ? 'encomenda' : ''}" data-status="${pedido.status}">
                    <div class="card-header d-flex justify-content-between"><strong>Pedido #${pedido.id}</strong><span>${dataPedidoFormatada}</span></div>
                    <div class="card-body">
                        <h5 class="card-title">${pedido.clienteNome}</h5>
                        <p class="card-text"><i class="bi bi-geo-alt-fill"></i> ${pedido.endereco}</p>
                        ${pedido.tipo === 'ENCOMENDA' ? `<p class="card-text agendamento-info"><i class="bi bi-calendar2-week"></i> <strong>Agendado:</strong> ${dataAgendamentoFormatada}</p>` : ''}
                        <div class="total-e-status d-flex justify-content-between align-items-center">
                            <span class="total">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}</span>
                             <select class="form-select form-select-sm w-auto" onchange='window.atualizarStatus(${pedidoString}, this.value)'>
                                <option value="Recebido" ${pedido.status === 'Recebido' ? 'selected' : ''}>Recebido</option>
                                <option value="Em Preparo" ${pedido.status === 'Em Preparo' ? 'selected' : ''}>Em Preparo</option>
                                <option value="Pronto para Retirada" ${pedido.status === 'Pronto para Retirada' ? 'selected' : ''}>Pronto p/ Retirada</option>
                                <option value="Saiu para Entrega" ${pedido.status === 'Saiu para Entrega' ? 'selected' : ''}>Saiu p/ Entrega</option>
                                <option value="Entregue" ${pedido.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                                <option value="Concluido" ${pedido.status === 'Concluido' ? 'selected' : ''}>Concluído</option>
                                <option value="Cancelado" ${pedido.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-end gap-2"><button class="btn btn-sm btn-outline-secondary" onclick="window.visualizarPedido(${pedido.id})" title="Visualizar e Imprimir"><i class="bi bi-eye"></i> Visualizar</button><a href="admin-pedidos.html" class="btn btn-sm btn-outline-primary" title="Ir para o KDS"><i class="bi bi-speedometer2"></i> KDS</a></div>
                </div>`;
            return col;
        }

        window.visualizarPedido = async function (pedidoId) {
            const modalTitle = document.getElementById('visualizacaoModalLabel');
            const modalContent = document.getElementById('visualizacao-content');
            const printButtonsContainer = document.getElementById('botoes-impressao');

            modalTitle.textContent = `Carregando Pedido #${pedidoId}...`;
            modalContent.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div></div>';
            printButtonsContainer.innerHTML = '';
            visualizacaoModal.show();

            try {
                const response = await fetchWithAuth(`/api/pedidos/${pedidoId}`);
                if (!response.ok) throw new Error('Falha ao buscar detalhes do pedido.');
                const pedido = await response.json();

                const totalPedido = pedido.itens.reduce((total, item) => total + (item.quantidade * item.precoUnitario), 0);
                const itensHtml = pedido.itens.map(item => `<tr><td>${item.quantidade}x</td><td>${item.produto}</td><td class="text-end">${(item.quantidade * item.precoUnitario).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</td></tr>`).join('');

                const tipoPedido = pedido.tipo.charAt(0).toUpperCase() + pedido.tipo.slice(1).toLowerCase();

                let enderecoHtml = '';
                if (pedido.enderecoEntrega) {
                    const end = pedido.enderecoEntrega;
                    enderecoHtml = `
                        <hr>
                        <div class="info-section mb-4">
                            <h6>Dados do Cliente</h6>
                            <p class="mb-1"><strong>Nome:</strong> ${pedido.clienteNome || 'Não informado'}</p>
                            <p class="mb-1"><strong>Endereço de Entrega:</strong><br>
                            ${end.logradouro}, ${end.numero} - ${end.bairro}<br>
                            ${end.cidade} - ${end.estado}, CEP: ${end.cep}
                            </p>
                        </div>`;
                }

                modalTitle.textContent = `Detalhes do Pedido #${pedido.id}`;
                modalContent.innerHTML = `
                    <div class="comprovante-header text-center mb-4"><h2>PedAi</h2><p class="text-muted">Comprovante de Pedido</p></div>
                    <div class="info-section row mb-2">
                        <div class="col-md-6"><p class="mb-1"><strong>Pedido:</strong> #${pedido.id}</p><p class="mb-1"><strong>Data:</strong> ${new Date(pedido.dataPedido).toLocaleString('pt-br')}</p></div>
                        <div class="col-md-6 text-md-end"><p class="mb-1"><strong>Tipo:</strong> ${tipoPedido}</p></div>
                    </div>
                    ${enderecoHtml}
                    <div class="table-responsive"><table class="table">
                        <thead><tr><th style="width: 15%;">Qtd.</th><th>Produto</th><th class="text-end" style="width: 30%;">Subtotal</th></tr></thead>
                        <tbody>${itensHtml}</tbody>
                        <tfoot><tr class="total-row"><td colspan="2" class="text-end border-0"><strong>Total:</strong></td><td class="text-end border-0">${totalPedido.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot>
                    </table></div>`;

                printButtonsContainer.innerHTML = `<button type="button" class="btn btn-success" onclick="window.imprimirCupom(${pedido.id})"><i class="bi bi-receipt"></i> Cupom</button><a href="/api/pedidos/${pedido.id}/pdf" target="_blank" class="btn btn-danger"><i class="bi bi-file-earmark-pdf"></i> PDF</a>`;
            } catch (error) { modalContent.innerHTML = '<div class="alert alert-danger">Não foi possível carregar os detalhes do pedido.</div>'; }
        }

        window.imprimirCupom = async function (pedidoId) {
            try {
                const response = await fetchWithAuth(`/api/pedidos/${pedidoId}`);
                if (!response.ok) throw new Error('Falha ao buscar dados para impressão.');
                const pedido = await response.json();
                const totalPedido = pedido.itens.reduce((total, item) => total + (item.quantidade * item.precoUnitario), 0);
                const itensText = pedido.itens.map(item => `${item.quantidade} x ${item.produto}\n          R$ ${(item.quantidade * item.precoUnitario).toFixed(2).replace('.', ',')}\n`).join('');

                const tipoPedido = pedido.tipo.charAt(0).toUpperCase() + pedido.tipo.slice(1).toLowerCase();

                let clienteEnderecoText = `Cliente: ${pedido.clienteNome}\n`;
                if (pedido.enderecoEntrega) {
                    const end = pedido.enderecoEntrega;
                    clienteEnderecoText += `Endereco: ${end.logradouro}, ${end.numero} - ${end.bairro}\n`;
                }

                const conteudoCupom = `
                    <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 5px;">
                        <h3 style="text-align: center; margin:0;">PedAi</h3>
                        <p style="text-align: center; margin:0;">Comprovante de Pedido</p>
                        <hr style="border-style: dashed;">
                        <p>Pedido: #${pedido.id}</p>
                        <p>Data: ${new Date(pedido.dataPedido).toLocaleString('pt-br')}</p>
                        <p>Tipo: ${tipoPedido}</p>
                        <hr style="border-style: dashed;">
                        <pre style="white-space: pre-wrap; margin:0;">${clienteEnderecoText}</pre>
                        <hr style="border-style: dashed;">
                        <pre style="white-space: pre-wrap; margin:0;">${itensText}</pre>
                        <hr style="border-style: dashed;">
                        <h4 style="text-align: right;">Total: R$ ${totalPedido.toFixed(2).replace('.', ',')}</h4>
                    </div>`;

                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<html><head><title>Cupom Pedido ${pedido.id}</title></head><body style="margin:0;">${conteudoCupom}</body><script>setTimeout(() => { window.print(); window.close(); }, 250);</script></html>`);
                printWindow.document.close();
            } catch (error) { Swal.fire('Erro!', 'Não foi possível carregar os dados para impressão do cupom.', 'error'); }
        }

        function getTodaysDateFilter() { const hoje = new Date(); hoje.setHours(0, 0, 0, 0); const dataInicial = hoje.toISOString(); hoje.setHours(23, 59, 59, 999); const dataFinal = hoje.toISOString(); document.getElementById('filtroDataInicial').value = dataInicial.split('T')[0]; document.getElementById('filtroDataFinal').value = dataFinal.split('T')[0]; return { dataInicial, dataFinal }; }
        function getFiltros() { const dataInicialInput = document.getElementById('filtroDataInicial').value; const dataFinalInput = document.getElementById('filtroDataFinal').value; return { cliente: document.getElementById('filtroCliente').value, status: document.getElementById('filtroStatus').value, dataInicial: dataInicialInput ? new Date(dataInicialInput + "T00:00:00Z").toISOString() : null, dataFinal: dataFinalInput ? new Date(dataFinalInput + "T23:59:59Z").toISOString() : null }; }
        function aplicarFiltros() { const filtros = getFiltros(); const abaAtiva = document.querySelector('#pills-tab .nav-link.active').id; const tipo = abaAtiva.includes('entregas') ? 'ENTREGA' : (abaAtiva.includes('retiradas') ? 'RETIRADA' : 'ENCOMENDA'); carregarPedidosPorTipo(tipo, filtros); filtroModal.hide(); }
        function limparFiltros() { document.getElementById('formFiltro').reset(); const filtrosDeHoje = getTodaysDateFilter(); const abaAtiva = document.querySelector('#pills-tab .nav-link.active').id; const tipo = abaAtiva.includes('entregas') ? 'ENTREGA' : (abaAtiva.includes('retiradas') ? 'RETIRADA' : 'ENCOMENDA'); carregarPedidosPorTipo(tipo, filtrosDeHoje); filtroModal.hide(); }
        window.atualizarStatus = function (pedido, novoStatus) { if (novoStatus === 'Concluido' && pedido.clienteId) { Swal.fire({ title: 'Gerar Conta a Receber?', text: `Deseja gerar uma conta a receber para o pedido #${pedido.id}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, gerar conta', cancelButtonText: 'Não, apenas concluir' }).then((result) => { if (result.isConfirmed) { abrirModalContaReceber(pedido); } else { finalizarAtualizacaoStatus(pedido.id, novoStatus, pedido.tipo); } }); } else { finalizarAtualizacaoStatus(pedido.id, novoStatus, pedido.tipo); } }
        async function finalizarAtualizacaoStatus(id, novoStatus, tipo) { try { await fetchWithAuth(`/api/pedidos/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ novoStatus }) }); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Pedido #${id} atualizado!`, showConfirmButton: false, timer: 2000 }); carregarPedidosPorTipo(tipo, getFiltros()); } catch (error) { Swal.fire('Erro!', `Não foi possível atualizar o status.`, 'error'); carregarPedidosPorTipo(tipo, getFiltros()); } }
        function abrirModalContaReceber(pedido) { pedidoParaGerarConta = pedido; const form = document.getElementById('formContaReceber'); form.reset(); const option = new Option(pedido.clienteNome, pedido.clienteId, true, true); clienteSelect.append(option).trigger('change'); document.getElementById('contaOrigem').value = `Referente ao Pedido #${pedido.id}`; document.getElementById('contaValor').value = pedido.total.toFixed(2); let dataVencimento = pedido.dataAgendamento ? new Date(pedido.dataAgendamento) : new Date(); document.getElementById('contaVencimento').value = dataVencimento.toISOString().split('T')[0]; contaReceberModal.show(); }
        async function salvarContaReceber(event) { event.preventDefault(); const payload = { clienteId: $('#contaClienteSelect').val(), origem: $('#contaOrigem').val(), valorTotal: $('#contaValor').val(), dataVencimento: $('#contaVencimento').val(), clienteNomeAvulso: null }; try { await fetchWithAuth('/api/contas-a-receber', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); contaReceberModal.hide(); Swal.fire('Sucesso!', 'Conta a receber gerada!', 'success'); finalizarAtualizacaoStatus(pedidoParaGerarConta.id, 'Concluido', pedidoParaGerarConta.tipo); } catch (error) { Swal.fire('Erro!', 'Não foi possível gerar a conta a receber.', 'error'); } }

    } catch (error) { console.error("Erro fatal na inicialização:", error); }
});

// Variáveis de estado para o carrinho manual
let carrinhoManual = [];
let totalPedidoManual = 0;

document.addEventListener("DOMContentLoaded", function () {
    const modalNovoPedido = document.getElementById('modalNovoPedido');

    if (modalNovoPedido) {
        // Inicializa o Select2 apenas quando o modal é exibido (evita bugs de largura)
        modalNovoPedido.addEventListener('shown.bs.modal', function () {
            inicializarSelect2PedidoManual();
        });

        // Limpa os dados ao fechar o modal
        modalNovoPedido.addEventListener('hidden.bs.modal', function () {
            document.getElementById('formNovoPedidoManual').reset();
            carrinhoManual = [];
            atualizarCarrinhoManual();
            $('#pedidoClienteId').val(null).trigger('change');
            $('#pedidoBuscaProduto').val(null).trigger('change');
        });
    }

    const formPedido = document.getElementById('formNovoPedidoManual');
    if (formPedido) {
        formPedido.addEventListener('submit', registrarPedidoManual);
    }
});

function inicializarSelect2PedidoManual() {
    // Busca de Clientes
    $('#pedidoClienteId').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#modalNovoPedido'),
        placeholder: 'Selecione ou busque o cliente',
        minimumInputLength: 0, // Permite clicar e já abrir a lista
        ajax: {
            url: '/api/clientes/search', // <-- CORREÇÃO AQUI
            dataType: 'json',
            delay: 250,
            data: (params) => ({ q: params.term || '' }), // <-- CORREÇÃO AQUI para enviar a query
            transport: async function (params, success, failure) {
                try {
                    // Monta a URL com a query string correta
                    const url = params.url + '?q=' + encodeURIComponent(params.data.q);
                    const response = await fetchWithAuth(url);

                    if (!response.ok) {
                        failure();
                        return;
                    }
                    const data = await response.json();

                    // Como a API já devolve um ClienteSearchDTO (id e text),
                    // basta mapear diretamente
                    success({
                        results: data.map(c => ({
                            id: c.id,
                            text: c.text
                        }))
                    });
                } catch (e) {
                    console.error(e);
                    failure();
                }
            }
        }
    });

    // Busca de Produtos (Reaproveitando o seu endpoint corrigido)
    $('#pedidoBuscaProduto').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#modalNovoPedido'),
        placeholder: 'Digite o nome do produto',
        minimumInputLength: 2,
        ajax: {
            url: '/api/produtos/search',
            dataType: 'json',
            delay: 250,
            data: (params) => ({ q: params.term }),
            processResults: function (data) {
                return { results: data };
            },
            cache: true,
            transport: async function (params, success, failure) {
                try {
                    const response = await fetchWithAuth(params.url + '?q=' + (params.data.q || ''));
                    if (!response.ok) return failure();
                    const data = await response.json();
                    success(data);
                } catch (error) { failure(); }
            }
        }
    }).on('select2:select', async function (e) {
        const produtoId = e.params.data.id;
        await adicionarProdutoAoCarrinho(produtoId);
        $(this).val(null).trigger('change'); // Reseta o campo de busca
    });
}

async function adicionarProdutoAoCarrinho(produtoId) {
    try {
        const response = await fetchWithAuth(`/api/produtos/${produtoId}`);
        if (!response.ok) throw new Error("Não foi possível carregar o produto.");
        const produto = await response.json();

        const itemExistente = carrinhoManual.find(i => i.produto.id === produto.id);

        if (itemExistente) {
            itemExistente.quantidade += 1;
        } else {
            carrinhoManual.push({
                produto: produto,
                quantidade: 1,
                valorUnitario: produto.preco,
                observacao: "",
                opcoes: [] // Array preparado para complementos, se for um Kit
            });
        }

        atualizarCarrinhoManual();
    } catch (error) {
        Swal.fire('Erro', error.message, 'error');
    }
}

function atualizarCarrinhoManual() {
    const container = document.getElementById('pedidoItensContainer');
    container.innerHTML = '';
    totalPedidoManual = 0;

    carrinhoManual.forEach((item, index) => {
        const subtotal = item.quantidade * item.valorUnitario;
        totalPedidoManual += subtotal;

        const div = document.createElement('div');
        // Nova classe customizada para o item
        div.className = 'list-group-item cart-item-modern border-0 d-flex justify-content-between align-items-center flex-wrap';
        div.innerHTML = `
            <div class="col-12 col-md-7 mb-2 mb-md-0 d-flex align-items-center">
                <div class="cart-icon-placeholder me-3 bg-light rounded d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="bi bi-box-seam text-muted fs-4"></i>
                </div>
                <div>
                    <h6 class="my-0 fw-bold">${item.produto.nome}</h6>
                    <div class="d-flex align-items-center mt-1">
                        <span class="me-2 text-muted small">R$ ${item.valorUnitario.toFixed(2)} x</span>
                        <input type="number" class="form-control form-control-sm text-center form-qtd" style="width: 70px; border-radius: 20px;" 
                            value="${item.quantidade}" min="1" step="1" onchange="alterarQtdCarrinho(${index}, this.value)">
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-5 d-flex justify-content-between justify-content-md-end align-items-center">
                <span class="fw-bold fs-5 text-indigo me-3">R$ ${subtotal.toFixed(2)}</span>
                <button type="button" class="btn btn-sm btn-light text-danger rounded-circle p-2 shadow-sm" onclick="removerItemCarrinho(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('pedidoTotalValor').innerText = `R$ ${totalPedidoManual.toFixed(2).replace('.', ',')}`;
}

window.alterarQtdCarrinho = function (index, qtd) {
    const novaQtd = parseInt(qtd);
    if (novaQtd > 0) {
        carrinhoManual[index].quantidade = novaQtd;
        atualizarCarrinhoManual();
    }
};

window.removerItemCarrinho = function (index) {
    carrinhoManual.splice(index, 1);
    atualizarCarrinhoManual();
};

async function registrarPedidoManual(event) {
    event.preventDefault();

    if (carrinhoManual.length === 0) {
        return Swal.fire('Atenção', 'Adicione pelo menos um produto ao pedido.', 'warning');
    }

    // Monta o Payload seguindo as chaves do PedidoDTO / Controller
    const payload = {
        clienteId: document.getElementById('pedidoClienteId').value,
        tipoPedido: document.querySelector('input[name="pedidoTipoRadio"]:checked').value,
        dataHoraPrevisao: document.getElementById('pedidoDataPrevisao').value,
        observacao: document.getElementById('pedidoObservacao').value,
        itens: carrinhoManual.map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            precoUnitario: item.valorUnitario,
            observacao: item.observacao,
            opcoes: item.opcoes
        }))
    };

    try {
        const response = await fetchWithAuth('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovoPedido'));
            modal.hide();
            Swal.fire('Sucesso!', 'Pedido gerado e enviado para a fila.', 'success').then(() => {
                window.location.reload();
            });
        } else {
            const err = await response.text();
            throw new Error(err);
        }
    } catch (error) {
        Swal.fire('Erro!', `Falha ao registrar pedido: ${error.message}`, 'error');
    }
}