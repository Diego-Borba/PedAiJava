document.addEventListener('DOMContentLoaded', function () {
    let tabelaContasPagar;
    const contaPagarModal = new bootstrap.Modal(document.getElementById('contaPagarModal'));
    const pagamentoPagarModal = new bootstrap.Modal(document.getElementById('pagamentoPagarModal'));
    const filtroModal = new bootstrap.Modal(document.getElementById('filtroModal'));

    let todosOsDados = [];

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
    const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
    const formatarDataParaInput = (data) => data ? new Date(data).toISOString().split('T')[0] : '';

    const fornecedorSelect = $('#contaFornecedorSelect').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#contaPagarModal'),
        placeholder: 'Busque por um fornecedor',
        allowClear: true,
        ajax: {
            url: '/api/fornecedores/search',
            dataType: 'json',
            delay: 250,
            transport: select2AuthTransport // CORREÇÃO APLICADA AQUI
        }
    });

    async function carregarContas() {
        try {
            const response = await fetchWithAuth('/api/contas-a-pagar'); // CORRIGIDO
            if (!response.ok) throw new Error('Falha ao buscar dados do servidor.');
            todosOsDados = await response.json();
            inicializarTabela(todosOsDados);
            atualizarDashboard(todosOsDados);
        } catch (error) {
            Swal.fire('Erro!', `Não foi possível carregar as contas: ${error.message}`, 'error');
        }
    }

    function inicializarTabela(dados) {
        const dadosMapeados = dados.map(item => ({
            id: item.id,
            fornecedorDescricao: item.fornecedorNome ? `${item.fornecedorNome} (${item.descricao})` : item.descricao,
            vencimento: item.dataVencimento,
            valorTotal: item.valorTotal,
            valorPago: item.valorPago,
            valorRestante: item.valorRestante,
            status: item.status.replace('_', ' '),
            dadosCompletos: item
        }));

        if ($.fn.DataTable.isDataTable('#tabela-contas-pagar')) {
            tabelaContasPagar.clear().rows.add(dadosMapeados).draw();
        } else {
            tabelaContasPagar = $('#tabela-contas-pagar').DataTable({
                data: dadosMapeados,
                columns: [
                    { data: "id" },
                    { data: "fornecedorDescricao" },
                    { data: "vencimento", render: formatarData },
                    { data: "valorTotal", render: formatarMoeda },
                    { data: "valorPago", render: formatarMoeda },
                    { data: "valorRestante", render: formatarMoeda },
                    {
                        data: "status",
                        render: function (data) {
                            const statusMap = { 'A PAGAR': 'status-apagar', 'PARCIALMENTE PAGO': 'status-parcial', 'PAGO': 'status-pago' };
                            return `<span class="status-badge ${statusMap[data] || ''}">${data}</span>`;
                        }
                    },
                    {
                        data: null,
                        title: "Ações",
                        render: function (data, type, row) {
                            let btnPagar = row.dadosCompletos.status !== 'PAGO' ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${row.id}" title="Registrar Pagamento"><i class="bi bi-currency-dollar"></i></button>` : '';
                            return `<div class="btn-group">${btnPagar}<button class="btn btn-sm btn-warning btn-editar" data-id="${row.id}" title="Editar"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger btn-excluir" data-id="${row.id}" title="Excluir"><i class="bi bi-trash"></i></button></div>`;
                        },
                        orderable: false,
                        width: "120px"
                    }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                order: [[2, 'asc']]
            });

            tabelaContasPagar.on('draw.dt', function () {
                atualizarTotalFiltrado();
            });
        }
        aplicarFiltros(false);
    }

    function atualizarDashboard(dados) {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        let totalAPagar = dados.filter(c => c.status !== 'PAGO').reduce((acc, c) => acc + c.valorRestante, 0);
        let totalPagoMes = dados.filter(c => c.status === 'PAGO').reduce((acc, c) => acc + c.valorPago, 0);
        let totalVencido = dados.filter(c => c.status !== 'PAGO' && new Date(c.dataVencimento) < hoje).reduce((acc, c) => acc + c.valorRestante, 0);

        $('#totalAPagar').text(formatarMoeda(totalAPagar));
        $('#totalPagoMes').text(formatarMoeda(totalPagoMes));
        $('#totalVencido').text(formatarMoeda(totalVencido));
    }

    function aplicarFiltros(fecharModal = true) {
        const texto = $('#filtroTexto').val().toLowerCase();
        const dataInicio = $('#filtroDataInicio').val();
        const dataFim = $('#filtroDataFim').val();
        const status = $('#filtroStatus').val();

        $.fn.dataTable.ext.search.pop();
        $.fn.dataTable.ext.search.push(
            function (settings, data, dataIndex) {
                const descricao = data[1].toLowerCase();
                const statusTabela = data[6];
                const vencimento = tabelaContasPagar.row(dataIndex).data().vencimento;

                const textoValido = !texto || descricao.includes(texto);
                const dataValida = (!dataInicio || vencimento >= dataInicio) && (!dataFim || vencimento <= dataFim);
                const statusValido = !status || statusTabela === status;

                return textoValido && dataValida && statusValido;
            }
        );
        tabelaContasPagar.draw();
        if (fecharModal) {
            filtroModal.hide();
        }
    }

    function atualizarTotalFiltrado() {
        const container = $('#totalFiltradoContainer');
        const valorSpan = $('#totalFiltradoValor');
        const isFiltroAtivo = $('#filtroTexto').val() || $('#filtroDataInicio').val() || $('#filtroDataFim').val() || $('#filtroStatus').val();

        if (!isFiltroAtivo) {
            container.hide();
            return;
        }

        const dadosFiltrados = tabelaContasPagar.rows({ search: 'applied' }).data().toArray();
        const total = dadosFiltrados.reduce((sum, item) => sum + (item.valorRestante || 0), 0);

        valorSpan.text(formatarMoeda(total));
        container.show();
    }

    $('#btnAbrirFiltros').on('click', () => filtroModal.show());
    $('#btnAplicarFiltros').on('click', () => aplicarFiltros(true));
    $('#btnLimparFiltros').on('click', () => {
        $('#formFiltro')[0].reset();
        aplicarFiltros(true);
    });

    $('#btnNovaContaPagar').on('click', function () {
        $('#formContaPagar')[0].reset();
        $('#contaPagarIdForm').val('');
        fornecedorSelect.val(null).trigger('change');
        $('#contaPagarModalLabel').text('Nova Despesa');
        contaPagarModal.show();
    });

    $('#tabela-contas-pagar tbody').on('click', 'button', function () {
        const id = $(this).data('id');
        const dadosLinha = todosOsDados.find(d => d.id == id);
        if (!dadosLinha) return;

        if ($(this).hasClass('btn-pagar')) {
            $('#pagamentoContaId').val(id);
            $('#modalPagarDescricao').text(dadosLinha.fornecedorNome || dadosLinha.descricao);
            $('#modalPagarValorRestante').text(formatarMoeda(dadosLinha.valorRestante));
            $('#valorAPagar').val(dadosLinha.valorRestante.toFixed(2));
            $('#dataPagamentoPagar').val(new Date().toISOString().slice(0, 10));
            pagamentoPagarModal.show();
        } else if ($(this).hasClass('btn-editar')) {
            $('#formContaPagar')[0].reset();
            $('#contaPagarIdForm').val(dadosLinha.id);
            $('#contaPagarModalLabel').text(`Editar Despesa #${dadosLinha.id}`);

            if (dadosLinha.fornecedorId) {
                const option = new Option(dadosLinha.fornecedorNome, dadosLinha.fornecedorId, true, true);
                fornecedorSelect.append(option).trigger('change');
            } else {
                fornecedorSelect.val(null).trigger('change');
            }

            $('#contaDescricao').val(dadosLinha.descricao);
            $('#contaPagarValor').val(dadosLinha.valorTotal.toFixed(2));
            $('#contaPagarVencimento').val(formatarDataParaInput(dadosLinha.dataVencimento));
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
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetchWithAuth(`/api/contas-a-pagar/${id}`, { method: 'DELETE' }); // CORRIGIDO
                        if (!response.ok) throw new Error('Falha ao excluir.');
                        Swal.fire('Excluído!', 'A despesa foi removida.', 'success');
                        carregarContas();
                    } catch (err) {
                        Swal.fire('Erro!', 'Não foi possível excluir a despesa.', 'error');
                    }
                }
            });
        }
    });

    $('#formContaPagar').on('submit', async (e) => {
        e.preventDefault();
        const id = $('#contaPagarIdForm').val();
        const url = id ? `/api/contas-a-pagar/${id}` : '/api/contas-a-pagar';
        const method = id ? 'PUT' : 'POST';

        const payload = {
            fornecedorId: $('#contaFornecedorSelect').val() ? parseInt($('#contaFornecedorSelect').val()) : null,
            descricao: $('#contaDescricao').val(),
            valorTotal: parseFloat($('#contaPagarValor').val()),
            dataVencimento: $('#contaPagarVencimento').val()
        };

        if (!payload.descricao || !payload.valorTotal || !payload.dataVencimento) {
            Swal.fire('Atenção!', 'Preencha os campos de Descrição, Valor e Vencimento.', 'warning');
            return;
        }

        try {
            const response = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); // CORRIGIDO
            if (!response.ok) throw new Error('Falha ao salvar despesa.');
            contaPagarModal.hide();
            Swal.fire('Sucesso!', 'Despesa salva com sucesso!', 'success');
            carregarContas();
        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    });

    $('#formPagamentoPagar').on('submit', async (e) => {
        e.preventDefault();
        const contaId = $('#pagamentoContaId').val();
        const payload = {
            valor: parseFloat($('#valorAPagar').val()),
            dataPagamento: $('#dataPagamentoPagar').val()
        };

        try {
            const response = await fetchWithAuth(`/api/contas-a-pagar/${contaId}/registrar-pagamento`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); // CORRIGIDO
            if (!response.ok) throw new Error('Falha ao registrar pagamento.');
            pagamentoPagarModal.hide();
            Swal.fire('Sucesso!', 'Pagamento registrado com sucesso!', 'success');
            carregarContas();
        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    });

    carregarContas();
});