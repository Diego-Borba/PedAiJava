document.addEventListener('DOMContentLoaded', function () {
    let tabelaContas;
    const pagamentoModal = new bootstrap.Modal(document.getElementById('pagamentoModal'));
    const contaModal = new bootstrap.Modal(document.getElementById('contaModal'));
    const detalhesModal = new bootstrap.Modal(document.getElementById('detalhesModal'));

    let todosOsDados = [];

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
    const formatarData = (data) => data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

    function carregarContas() {
        const dadosMock = [
            { id: 101, clienteId: 1, clienteNome: 'João da Silva', origem: 'Pedido #1', valorTotal: 150.50, valorPago: 0, status: 'A RECEBER', vencimento: '2025-09-20' },
            { id: 102, clienteId: null, clienteNome: 'Cliente Balcão', origem: 'Venda Manual', valorTotal: 85.00, valorPago: 50.00, status: 'PARCIALMENTE PAGO', vencimento: '2025-09-28' },
            { id: 103, clienteId: 2, clienteNome: 'Maria Oliveira', origem: 'Pedido #5', valorTotal: 320.00, valorPago: 320.00, status: 'RECEBIDO', vencimento: '2025-09-15' },
            { id: 104, clienteId: 3, clienteNome: 'Empresa XYZ', origem: 'Serviço Prestado', valorTotal: 1200.00, valorPago: 0, status: 'A RECEBER', vencimento: '2025-08-10' }
        ];
        todosOsDados = dadosMock;
        inicializarTabela(todosOsDados);
        atualizarDashboard(todosOsDados);
    }

    function inicializarTabela(dados) {
        if ($.fn.DataTable.isDataTable('#tabela-contas')) {
            tabelaContas.clear().rows.add(dados).draw();
        } else {
            tabelaContas = $('#tabela-contas').DataTable({
                data: dados,
                columns: [
                    { data: "id" }, { data: "clienteNome" }, { data: "origem" },
                    { data: null, render: (data, type, row) => formatarMoeda(row.valorTotal - row.valorPago) },
                    { data: "status", render: function (data) {
                        const s = { 'A RECEBER': 'status-areceber', 'PARCIALMENTE PAGO': 'status-parcial', 'RECEBIDO': 'status-recebido' };
                        return `<span class="status-badge ${s[data] || ''}">${data.replace('_', ' ')}</span>`;
                    }},
                    { data: "vencimento", render: formatarData },
                    { data: "id", title: "Ações", render: function (d, t, r) {
                        let btnPagar = r.status !== 'RECEBIDO' ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${d}" title="Pagar"><i class="bi bi-currency-dollar"></i></button>` : '';
                        return `<div class="btn-group" role="group"><button class="btn btn-sm btn-info btn-detalhes" data-id="${d}" title="Detalhes"><i class="bi bi-eye"></i></button>${btnPagar}<button class="btn btn-sm btn-warning btn-editar" data-id="${d}" title="Editar"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger btn-excluir" data-id="${d}" title="Excluir"><i class="bi bi-trash"></i></button></div>`;
                    }, orderable: false, width: "150px" }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                order: [[5, 'asc']]
            });
        }
    }

    function atualizarDashboard(dados) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        let aReceber = dados.filter(c => c.status !== 'RECEBIDO').reduce((acc, c) => acc + (c.valorTotal - c.valorPago), 0);
        let recebidoMes = dados.filter(c => c.status === 'RECEBIDO').reduce((acc, c) => acc + c.valorPago, 0);
        let vencido = dados.filter(c => c.status !== 'RECEBIDO' && new Date(c.vencimento + 'T00:00:00') < hoje).reduce((acc, c) => acc + (c.valorTotal - c.valorPago), 0);
        $('#totalAReceber').text(formatarMoeda(aReceber));
        $('#totalRecebidoMes').text(formatarMoeda(recebidoMes));
        $('#totalVencido').text(formatarMoeda(vencido));
    }

    function aplicarFiltros() {
        const texto = $('#filtroTexto').val().toLowerCase();
        const dataInicio = $('#filtroDataInicio').val(), dataFim = $('#filtroDataFim').val(), status = $('#filtroStatus').val();
        const dadosFiltrados = todosOsDados.filter(c => 
            (texto === '' || c.clienteNome.toLowerCase().includes(texto) || c.origem.toLowerCase().includes(texto)) &&
            (dataInicio === '' || c.vencimento >= dataInicio) &&
            (dataFim === '' || c.vencimento <= dataFim) &&
            (status === '' || c.status === status)
        );
        tabelaContas.clear().rows.add(dadosFiltrados).draw();
    }

    $('#filtroTexto').on('keyup', aplicarFiltros);
    $('#filtroDataInicio, #filtroDataFim, #filtroStatus').on('change', aplicarFiltros);

    // Lógica dos modais... (igual à resposta anterior, já estava completa)

    carregarContas();
});