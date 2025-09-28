document.addEventListener('DOMContentLoaded', function() {
    try {
        const filtroModal = new bootstrap.Modal(document.getElementById('filtroModal'));
        const contaReceberModal = new bootstrap.Modal(document.getElementById('contaReceberModal'));
        const visualizacaoModal = new bootstrap.Modal(document.getElementById('visualizacaoModal'));
        
        const abas = {
            'ENTREGA': 'pills-entregas', 'RETIRADA': 'pills-retiradas', 'ENCOMENDA': 'pills-encomendas'
        };
        
        let pedidoParaGerarConta = null;

        const clienteSelect = $('#contaClienteSelect').select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#contaReceberModal'),
            placeholder: 'Busque por um cliente cadastrado',
        });

        // --- CARREGAMENTO INICIAL E EVENTOS ---
        carregarTodosOsPedidos();

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

        // --- FUNÇÕES DE DADOS E RENDERIZAÇÃO ---
        async function carregarTodosOsPedidos(filtros = {}) {
            const promises = Object.keys(abas).map(tipo => carregarPedidosPorTipo(tipo, filtros));
            await Promise.all(promises);
        }

        async function carregarPedidosPorTipo(tipo, filtros = {}) {
            const idAba = `pills-${tipo.toLowerCase()}s`;
            const container = document.getElementById(idAba);
            const contador = document.getElementById(`count-${tipo.toLowerCase()}s`);

            if (!container || !contador) return;

            container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
            
            try {
                const response = await axios.get('/api/pedidos/por-tipo', { params: { tipo, ...filtros } });
                const pedidos = response.data;
                container.innerHTML = '';
                contador.textContent = pedidos.length;

                if (pedidos.length === 0) {
                    container.innerHTML = `<div class="text-center p-5 bg-light rounded mt-3"><p class="mb-0 text-muted">Nenhum pedido encontrado com os filtros atuais.</p></div>`;
                    return;
                }
                const row = document.createElement('div');
                row.className = 'row g-3';
                pedidos.forEach(pedido => row.appendChild(criarCardPedido(pedido)));
                container.appendChild(row);
            } catch (error) {
                container.innerHTML = `<div class="alert alert-danger">Erro ao carregar pedidos. Verifique o console para mais detalhes.</div>`;
                console.error("Erro na API:", error);
            }
        }

        function criarCardPedido(pedido) {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4 d-flex';

            const dataPedidoFormatada = new Date(pedido.dataPedido).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const dataAgendamentoFormatada = pedido.dataAgendamento ? new Date(pedido.dataAgendamento).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : '';
            const itensHtml = pedido.itens.map(item => `<li class="list-group-item bg-transparent">${item}</li>`).join('');

            const pedidoString = JSON.stringify(pedido).replace(/'/g, "&apos;");

            col.innerHTML = `
                <div class="card h-100 shadow-sm pedido-card w-100">
                    <div class="card-header bg-dark text-white d-flex justify-content-between">
                        <strong>Pedido #${pedido.id}</strong>
                        <span>${dataPedidoFormatada}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${pedido.clienteNome}</h5>
                        ${pedido.tipo === 'ENCOMENDA' ? `<p class="card-text text-danger fw-bold"><i class="bi bi-calendar2-week"></i> Agendado para: ${dataAgendamentoFormatada}</p>` : ''}
                        <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Endereço:</strong> ${pedido.endereco}</p>
                        <p class="card-text"><i class="bi bi-credit-card"></i> <strong>Pagamento:</strong> ${pedido.formaPagamento || 'Não informado'}</p>
                        <h6 class="mt-3">Itens:</h6>
                        <ul class="list-group list-group-flush mb-3">${itensHtml}</ul>
                        <p class="text-end fs-5 fw-bold mt-auto">Total: <span class="text-primary">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}</span></p>
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <select class="form-select form-select-sm w-auto" onchange='atualizarStatus(${pedidoString}, this.value)'>
                            <option value="Recebido" ${pedido.status === 'Recebido' ? 'selected' : ''}>Recebido</option>
                            <option value="Em Preparo" ${pedido.status === 'Em Preparo' ? 'selected' : ''}>Em Preparo</option>
                            <option value="Pronto para Retirada" ${pedido.status === 'Pronto para Retirada' ? 'selected' : ''}>Pronto p/ Retirada</option>
                            <option value="Saiu para Entrega" ${pedido.status === 'Saiu para Entrega' ? 'selected' : ''}>Saiu p/ Entrega</option>
                            <option value="Entregue" ${pedido.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                            <option value="Concluido" ${pedido.status === 'Concluido' ? 'selected' : ''}>Concluído</option>
                            <option value="Cancelado" ${pedido.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary" onclick="visualizarPedido(${pedido.id})" title="Visualizar e Imprimir">
                                <i class="bi bi-printer"></i>
                            </button>
                            <a href="admin-pedidos.html" class="btn btn-sm btn-outline-primary" title="Ir para o KDS"><i class="bi bi-speedometer2"></i></a>
                        </div>
                    </div>
                </div>`;
            return col;
        }

        // --- LÓGICA DE AÇÕES (FUNÇÕES GLOBAIS) ---
        window.atualizarStatus = function(pedido, novoStatus) {
            if (novoStatus === 'Concluido') {
                Swal.fire({
                    title: 'Gerar Conta a Receber?',
                    text: `Deseja gerar uma conta a receber para o pedido #${pedido.id}?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, gerar conta',
                    cancelButtonText: 'Não, apenas concluir'
                }).then((result) => {
                    if (result.isConfirmed) {
                        abrirModalContaReceber(pedido);
                    } else {
                        finalizarAtualizacaoStatus(pedido.id, novoStatus, pedido.tipo);
                    }
                });
            } else {
                finalizarAtualizacaoStatus(pedido.id, novoStatus, pedido.tipo);
            }
        }

        async function finalizarAtualizacaoStatus(id, novoStatus, tipo) {
            try {
                await axios.put(`/api/pedidos/${id}/status`, { novoStatus });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Pedido #${id} atualizado!`, showConfirmButton: false, timer: 2000 });
                carregarPedidosPorTipo(tipo, getFiltros());
            } catch (error) {
                Swal.fire('Erro!', `Não foi possível atualizar o status.`, 'error');
            }
        }

        function abrirModalContaReceber(pedido) {
            pedidoParaGerarConta = pedido;
            const form = document.getElementById('formContaReceber');
            form.reset();

            const option = new Option(pedido.clienteNome, pedido.clienteId, true, true);
            clienteSelect.append(option).trigger('change');
            
            document.getElementById('contaOrigem').value = `Pedido #${pedido.id}`;
            document.getElementById('contaValor').value = pedido.total.toFixed(2);

            let dataVencimento = new Date();
            if (pedido.tipo === 'ENCOMENDA' && pedido.dataAgendamento) {
                dataVencimento = new Date(pedido.dataAgendamento);
            }
            document.getElementById('contaVencimento').value = dataVencimento.toISOString().split('T')[0];
            
            contaReceberModal.show();
        }

        async function salvarContaReceber(event) {
            event.preventDefault();
            const payload = {
                clienteId: document.getElementById('contaClienteSelect').value,
                origem: document.getElementById('contaOrigem').value,
                valorTotal: document.getElementById('contaValor').value,
                dataVencimento: document.getElementById('contaVencimento').value,
                clienteNomeAvulso: null
            };

            try {
                await axios.post('/api/contas-a-receber', payload);
                contaReceberModal.hide();
                Swal.fire('Sucesso!', 'Conta a receber gerada com sucesso!', 'success');
                finalizarAtualizacaoStatus(pedidoParaGerarConta.id, 'Concluido', pedidoParaGerarConta.tipo);
            } catch (error) {
                Swal.fire('Erro!', 'Não foi possível gerar a conta a receber.', 'error');
            }
        }
        
        window.visualizarPedido = async function(pedidoId) {
            const modalTitle = document.getElementById('visualizacaoModalLabel');
            const modalContent = document.getElementById('visualizacao-content');
            const printButtonsContainer = document.getElementById('botoes-impressao');
            
            modalTitle.textContent = 'Carregando...';
            modalContent.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div></div>';
            printButtonsContainer.innerHTML = '';
            visualizacaoModal.show();

            try {
                const response = await axios.get(`/api/pedidos/${pedidoId}`);
                const pedido = response.data;
                const totalPedido = pedido.itens.reduce((total, item) => total + (item.quantidade * item.precoUnitario), 0);
                const itensHtml = pedido.itens.map(item => `<tr><td>${item.quantidade}</td><td>${item.produto}</td><td class="text-end">${(item.quantidade * item.precoUnitario).toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})}</td></tr>`).join('');
                
                modalTitle.textContent = `Visualizar Pedido #${pedido.id}`;
                modalContent.innerHTML = `
                    <h2 class="text-center mb-1">Comprovante de Pedido</h2><h1 class="text-center mb-4">PedAi</h1><hr>
                    <p><strong>Pedido:</strong> #${pedido.id}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.dataPedido).toLocaleString('pt-br')}</p>
                    <p><strong>Status:</strong> ${pedido.status}</p><hr>
                    <table class="table">
                        <thead><tr><th style="width: 15%;">Qtd.</th><th>Produto</th><th class="text-end" style="width: 30%;">Subtotal</th></tr></thead>
                        <tbody>${itensHtml}</tbody>
                        <tfoot><tr><td colspan="2" class="text-end border-0 fs-5"><strong>Total:</strong></td><td class="text-end border-0 fs-5"><strong>${totalPedido.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})}</strong></td></tr></tfoot>
                    </table>`;
                
                printButtonsContainer.innerHTML = `
                    <button type="button" class="btn btn-success" onclick="imprimirCupom(${pedido.id})"><i class="bi bi-receipt"></i> Imprimir Cupom (80mm)</button>
                    <button type="button" class="btn btn-danger" onclick="window.open('/api/pedidos/${pedido.id}/pdf', '_blank')"><i class="bi bi-file-earmark-pdf"></i> Salvar como PDF</button>
                `;
            } catch (error) {
                modalContent.innerHTML = '<div class="alert alert-danger">Não foi possível carregar os detalhes do pedido.</div>';
            }
        }

        window.imprimirCupom = async function(pedidoId) {
            try {
                const response = await axios.get(`/api/pedidos/${pedidoId}`);
                const pedido = response.data;
                const totalPedido = pedido.itens.reduce((total, item) => total + (item.quantidade * item.precoUnitario), 0);
                const itensText = pedido.itens.map(item => `${item.quantidade} x ${item.produto}\n          R$ ${(item.quantidade * item.precoUnitario).toFixed(2).replace('.',',')}\n`).join('');
                const conteudoCupom = `
                    <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 5px;">
                        <h3 style="text-align: center; margin:0;">PedAi</h3>
                        <p style="text-align: center; margin:0;">Comprovante de Pedido</p>
                        <hr style="border-style: dashed;">
                        <p>Pedido: #${pedido.id}</p>
                        <p>Data: ${new Date(pedido.dataPedido).toLocaleString('pt-br')}</p>
                        <p>Status: ${pedido.status}</p>
                        <hr style="border-style: dashed;">
                        <pre style="white-space: pre-wrap; margin:0;">${itensText}</pre>
                        <hr style="border-style: dashed;">
                        <h4 style="text-align: right;">Total: R$ ${totalPedido.toFixed(2).replace('.',',')}</h4>
                    </div>`;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<html><head><title>Cupom Pedido ${pedido.id}</title></head><body style="margin:0;">${conteudoCupom}</body><script>setTimeout(() => { window.print(); window.close(); }, 250);</script></html>`);
                printWindow.document.close();
            } catch (error) {
                Swal.fire('Erro!', 'Não foi possível carregar os dados para impressão do cupom.', 'error');
            }
        }
        
        // --- LÓGICA DE FILTROS ---
        function getFiltros() {
            const dataInicial = document.getElementById('filtroDataInicial').value;
            const dataFinal = document.getElementById('filtroDataFinal').value;
            return {
                cliente: document.getElementById('filtroCliente').value,
                status: document.getElementById('filtroStatus').value,
                dataInicial: dataInicial ? new Date(dataInicial + "T00:00:00Z").toISOString() : null,
                dataFinal: dataFinal ? new Date(dataFinal + "T23:59:59Z").toISOString() : null
            };
        }

        function aplicarFiltros() {
            const filtros = getFiltros();
            const abaAtiva = document.querySelector('#pills-tab .nav-link.active').id;
            let tipo = 'ENTREGA';
            if (abaAtiva.includes('retiradas')) tipo = 'RETIRADA';
            if (abaAtiva.includes('encomendas')) tipo = 'ENCOMENDA';
            
            carregarPedidosPorTipo(tipo, filtros);
            filtroModal.hide();
        }

        function limparFiltros() {
            document.getElementById('formFiltro').reset();
            aplicarFiltros();
        }

    } catch (error) {
        console.error("Erro fatal na inicialização:", error);
    }
});