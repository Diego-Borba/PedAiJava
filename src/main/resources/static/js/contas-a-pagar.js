document.addEventListener('DOMContentLoaded', function () {
    let tabelaContasPagar;
    const contaPagarModal = new bootstrap.Modal(document.getElementById('contaPagarModal'));
    const pagamentoPagarModal = new bootstrap.Modal(document.getElementById('pagamentoPagarModal'));

    let todosOsDados = [];

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
    const formatarData = (data) => data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

    function carregarContas() {
        // Mock de dados para Contas a Pagar
        const dadosMock = [
            { id: 201, fornecedorId: 1, fornecedorNome: 'Distribuidora Alimentos & Cia', valorTotal: 850.00, valorPago: 0, status: 'A PAGAR', vencimento: '2025-09-25' },
            { id: 202, fornecedorId: null, fornecedorNome: 'Conta de Energia', valorTotal: 430.25, valorPago: 430.25, status: 'PAGO', vencimento: '2025-09-10' },
            { id: 203, fornecedorId: null, fornecedorNome: 'Aluguel', valorTotal: 1500.00, valorPago: 750.00, status: 'PARCIALMENTE PAGO', vencimento: '2025-10-05' }
        ];
        todosOsDados = dadosMock;
        inicializarTabela(todosOsDados);
        atualizarDashboard(todosOsDados);
    }

    function inicializarTabela(dados) {
        if ($.fn.DataTable.isDataTable('#tabela-contas-pagar')) {
            tabelaContasPagar.clear().rows.add(dados).draw();
        } else {
            tabelaContasPagar = $('#tabela-contas-pagar').DataTable({
                data: dados,
                columns: [
                    { data: "id" },
                    { data: "fornecedorNome" },
                    { data: null, render: (data, type, row) => formatarMoeda(row.valorTotal - row.valorPago) },
                    { data: "status", render: function (data) {
                        const statusMap = { 'A PAGAR': 'status-apagar', 'PARCIALMENTE PAGO': 'status-parcial', 'PAGO': 'status-pago' };
                        return `<span class="status-badge ${statusMap[data] || ''}">${data.replace('_', ' ')}</span>`;
                    }},
                    { data: "vencimento", render: formatarData },
                    { data: "id", title: "Ações", render: function (data, type, row) {
                        let btnPagar = row.status !== 'PAGO' ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${data}" title="Registrar Pagamento"><i class="bi bi-currency-dollar"></i></button>` : '';
                        return `<div class="btn-group">${btnPagar}<button class="btn btn-sm btn-warning btn-editar" data-id="${data}" title="Editar"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger btn-excluir" data-id="${data}" title="Excluir"><i class="bi bi-trash"></i></button></div>`;
                    }, orderable: false, width: "120px" }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                order: [[4, 'asc']]
            });
        }
    }

    function atualizarDashboard(dados) {
        let totalAPagar = dados.filter(c => c.status !== 'PAGO').reduce((acc, c) => acc + (c.valorTotal - c.valorPago), 0);
        let totalPagoMes = dados.filter(c => c.status === 'PAGO' /* Lógica de data futura */).reduce((acc, c) => acc + c.valorPago, 0);
        $('#totalAPagar').text(formatarMoeda(totalAPagar));
        $('#totalPagoMes').text(formatarMoeda(totalPagoMes));
    }

    // --- Lógica de Ações e Modais ---

    $('#btnNovaContaPagar').on('click', function() {
        $('#formContaPagar')[0].reset();
        $('#contaPagarIdForm').val('');
        $('#contaPagarModalLabel').text('Nova Despesa');
        contaPagarModal.show();
    });

    $('#tabela-contas-pagar tbody').on('click', 'button', function () {
        const id = $(this).data('id');
        const dadosLinha = tabelaContasPagar.row($(this).parents('tr')).data();

        if ($(this).hasClass('btn-pagar')) {
            const valorRestante = dadosLinha.valorTotal - dadosLinha.valorPago;
            $('#pagamentoContaId').val(id);
            $('#modalPagarDescricao').text(dadosLinha.fornecedorNome);
            $('#modalPagarValorRestante').text(formatarMoeda(valorRestante));
            $('#valorAPagar').val(valorRestante.toFixed(2));
            $('#dataPagamentoPagar').val(new Date().toISOString().slice(0, 10));
            pagamentoPagarModal.show();
        } else if ($(this).hasClass('btn-editar')) {
            $('#formContaPagar')[0].reset();
            $('#contaPagarIdForm').val(dadosLinha.id);
            $('#contaPagarModalLabel').text(`Editar Despesa #${dadosLinha.id}`);
            $('#contaFornecedorId').val(dadosLinha.fornecedorId || '');
            $('#contaDescricao').val(dadosLinha.fornecedorNome);
            $('#contaPagarValor').val(dadosLinha.valorTotal.toFixed(2));
            $('#contaPagarVencimento').val(dadosLinha.vencimento);
            contaPagarModal.show();
        } else if ($(this).hasClass('btn-excluir')) {
            Swal.fire({
                title: 'Tem certeza?',
                text: `Deseja realmente excluir a despesa #${id}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonText: 'Cancelar',
                confirmButtonText: 'Sim, excluir!'
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log(`Excluindo despesa ${id}`);
                    Swal.fire('Excluído!', 'A despesa foi removida. (Simulado)', 'success');
                    carregarContas();
                }
            });
        }
    });
    
    // Simulação de submit dos formulários
    $('#formContaPagar').on('submit', (e) => {
        e.preventDefault();
        contaPagarModal.hide();
        Swal.fire('Sucesso!', 'Despesa salva com sucesso! (Simulado)', 'success');
    });

    $('#formPagamentoPagar').on('submit', (e) => {
        e.preventDefault();
        pagamentoPagarModal.hide();
        Swal.fire('Sucesso!', 'Pagamento registrado com sucesso! (Simulado)', 'success');
    });

    // Carga inicial
    carregarContas();
});