document.addEventListener('DOMContentLoaded', function () {
    const dateFilter = document.getElementById('dashboard-date-filter');
    const loadingEl = document.getElementById('dashboard-loading');
    const contentEl = document.getElementById('dashboard-content');

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
    const hoje = new Date().toISOString().split('T')[0];

    async function carregarDashboard(dataFiltro) {
        if (!dataFiltro) return;

        contentEl.style.display = 'none';
        loadingEl.style.display = 'block';

        const dataInicial = `${dataFiltro}T00:00:00Z`;
        const dataFinal = `${dataFiltro}T23:59:59Z`;

        await Promise.all([
            carregarContas(dataFiltro),
            carregarVendas(dataInicial, dataFinal),
            carregarPedidos(dataInicial, dataFinal)
        ]);

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    }

    async function carregarContas(dataFiltro) {
        const receberHojeEl = document.getElementById('receber-hoje');
        const receberTotalEl = document.getElementById('receber-total');
        const pagarHojeEl = document.getElementById('pagar-hoje');
        const pagarTotalEl = document.getElementById('pagar-total');

        try {
            const [resReceber, resPagar] = await Promise.all([
                fetchWithAuth('/api/contas-a-receber'),
                fetchWithAuth('/api/contas-a-pagar')
            ]);

            if (!resReceber.ok) throw new Error('Falha ao buscar contas a receber.');
            if (!resPagar.ok) throw new Error('Falha ao buscar contas a pagar.');

            const contasReceber = await resReceber.json();
            const contasPagar = await resPagar.json();

            let totalReceberPendente = 0;
            let totalReceberHoje = 0;
            contasReceber.forEach(c => {
                if (c.status !== 'RECEBIDO') {
                    totalReceberPendente += c.valorRestante;
                    if (c.dataVencimento === dataFiltro) {
                        totalReceberHoje += c.valorRestante;
                    }
                }
            });

            let totalPagarPendente = 0;
            let totalPagarHoje = 0;
            contasPagar.forEach(c => {
                if (c.status !== 'PAGO') {
                    totalPagarPendente += c.valorRestante;
                    if (c.dataVencimento === dataFiltro) {
                        totalPagarHoje += c.valorRestante;
                    }
                }
            });

            receberHojeEl.textContent = formatarMoeda(totalReceberHoje);
            receberTotalEl.textContent = `Total pendente: ${formatarMoeda(totalReceberPendente)}`;
            pagarHojeEl.textContent = formatarMoeda(totalPagarHoje);
            pagarTotalEl.textContent = `Total pendente: ${formatarMoeda(totalPagarPendente)}`;

        } catch (error) {
            console.error("Erro ao carregar contas:", error);
            [receberHojeEl, receberTotalEl, pagarHojeEl, pagarTotalEl].forEach(el => el.textContent = "Erro");
        }
    }

    async function carregarVendas(dataInicial, dataFinal) {
        const totalDiaEl = document.getElementById('vendas-total-dia');
        const totalCountEl = document.getElementById('vendas-total-count');
        const topItemEl = document.getElementById('vendas-top-item-dia');
        const topItemCountEl = document.getElementById('vendas-top-item-count');
        const listaVendasEl = document.getElementById('lista-vendas-dia');
        const loadingVendasEl = document.getElementById('loading-vendas');

        try {
            const params = new URLSearchParams({ dataInicial, dataFinal });
            const response = await fetchWithAuth(`/api/relatorios/vendas?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao buscar relatório de vendas.');

            const vendas = await response.json();

            const totalVendidoDia = vendas.reduce((acc, v) => acc + v.total, 0);
            const contagemItens = new Map();

            vendas.forEach(venda => {
                venda.itens.forEach(itemString => {
                    const match = itemString.match(/^(\d+)x\s(.+)/);
                    if (match) {
                        const qtde = parseInt(match[1]);
                        const nome = match[2];
                        contagemItens.set(nome, (contagemItens.get(nome) || 0) + qtde);
                    }
                });
            });

            let topItemNome = "Nenhuma";
            let topItemQtde = 0;
            if (contagemItens.size > 0) {
                [topItemNome, topItemQtde] = [...contagemItens.entries()].reduce((a, e) => e[1] > a[1] ? e : a);
            }

            totalDiaEl.textContent = formatarMoeda(totalVendidoDia);
            totalCountEl.textContent = `${vendas.length} ${vendas.length === 1 ? 'venda' : 'vendas'}`;
            topItemEl.textContent = topItemNome;
            topItemCountEl.textContent = `${topItemQtde} ${topItemQtde === 1 ? 'unidade' : 'unidades'}`;

            listaVendasEl.innerHTML = '';
            if (vendas.length === 0) {
                listaVendasEl.innerHTML = '<li class="list-group-item text-muted">Nenhuma venda registrada para esta data.</li>';
            } else {
                vendas.sort((a, b) => b.total - a.total)
                    .slice(0, 5) // Pega as top 5
                    .forEach(venda => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item';
                        li.innerHTML = `
                              <div class="venda-info">
                                  <span>Venda #${venda.id}</span>
                                  <small>${venda.clienteNome}</small>
                              </div>
                              <span class="venda-valor">${formatarMoeda(venda.total)}</span>
                          `;
                        listaVendasEl.appendChild(li);
                    });
            }
            loadingVendasEl.style.display = 'none';

        } catch (error) {
            console.error("Erro ao carregar vendas:", error);
            totalDiaEl.textContent = "Erro";
            topItemEl.textContent = "Erro";
            loadingVendasEl.innerHTML = '<p class="text-danger small">Erro ao carregar vendas.</p>';
        }
    }

    async function carregarPedidos(dataInicial, dataFinal) {
        const listaPedidosEl = document.getElementById('lista-pedidos-dia');
        const loadingPedidosEl = document.getElementById('loading-pedidos');

        try {
            const params = new URLSearchParams({ dataInicial, dataFinal });
            const [resEntregas, resRetiradas, resEncomendas] = await Promise.all([
                fetchWithAuth(`/api/pedidos/por-tipo?tipo=ENTREGA&${params.toString()}`),
                fetchWithAuth(`/api/pedidos/por-tipo?tipo=RETIRADA&${params.toString()}`),
                fetchWithAuth(`/api/pedidos/por-tipo?tipo=ENCOMENDA&${params.toString()}`)
            ]);

            const pedidosEntregas = await resEntregas.json();
            const pedidosRetiradas = await resRetiradas.json();
            const pedidosEncomendas = await resEncomendas.json();

            const todosPedidos = [...pedidosEntregas, ...pedidosRetiradas, ...pedidosEncomendas];

            const pedidosPendentes = todosPedidos.filter(p =>
                p.status !== 'Concluido' && p.status !== 'Entregue' && p.status !== 'Cancelado'
            ).sort((a, b) => new Date(a.dataPedido) - new Date(b.dataPedido));

            listaPedidosEl.innerHTML = '';
            if (pedidosPendentes.length === 0) {
                listaPedidosEl.innerHTML = '<li class="list-group-item text-muted">Nenhum pedido pendente para esta data.</li>';
            } else {
                const agora = new Date();
                pedidosPendentes.forEach(pedido => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    const dataPedido = new Date(pedido.dataPedido);
                    const diffMs = agora - dataPedido;
                    const diffMins = Math.round(diffMs / 60000);

                    let statusLabel = 'Pendente';
                    let statusClass = 'status-pendente';

                    if (diffMins > 30 && pedido.status === 'Em Preparo') {
                        statusLabel = 'Atrasado';
                        statusClass = 'status-atrasado';
                    }

                    li.innerHTML = `
                        <div class="pedido-info">
                            <span>#${pedido.id} - ${pedido.clienteNome}</span>
                            <small>${pedido.tipo} | ${dataPedido.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                        <span class="pedido-status ${statusClass}">${statusLabel}</span>
                    `;
                    listaPedidosEl.appendChild(li);
                });
            }
            loadingPedidosEl.style.display = 'none';

        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            loadingPedidosEl.innerHTML = '<p class="text-danger small">Erro ao carregar pedidos.</p>';
        }
    }

    dateFilter.addEventListener('change', () => {
        carregarDashboard(dateFilter.value);
    });

    dateFilter.value = hoje;
    carregarDashboard(hoje);
});