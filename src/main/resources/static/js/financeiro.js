// src/main/resources/static/js/financeiro.js
document.addEventListener('DOMContentLoaded', function () {
    let tabelaContas;
    const pagamentoModal = new bootstrap.Modal(document.getElementById('pagamentoModal'));
    const contaModal = new bootstrap.Modal(document.getElementById('contaModal'));
    const detalhesModal = new bootstrap.Modal(document.getElementById('detalhesModal'));
    const filtroModal = new bootstrap.Modal(document.getElementById('filtroModal'));

    let todosOsDados = [];

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
    const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
    const formatarDataParaInput = (data) => data ? new Date(data).toISOString().split('T')[0] : '';

    const clienteSelect = $('#contaClienteSelect').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#contaModal'),
        placeholder: 'Busque por um cliente cadastrado',
        allowClear: true,
        ajax: {
            url: '/api/clientes/search',
            dataType: 'json',
            delay: 250,
            data: (params) => ({ q: params.term }),
            processResults: (data) => ({ results: data }),
            cache: true
        }
    });

    const nomeAvulsoInput = $('#contaClienteNomeAvulso');

    clienteSelect.on('change', function() {
        if ($(this).val()) {
            nomeAvulsoInput.prop('disabled', true).val('');
        } else {
            nomeAvulsoInput.prop('disabled', false);
        }
    });
    nomeAvulsoInput.on('input', function() {
        if ($(this).val()) {
            clienteSelect.prop('disabled', true).val(null).trigger('change');
        } else {
            clienteSelect.prop('disabled', false);
        }
    });

    async function carregarContas() {
        try {
            const response = await fetchWithAuth('/api/contas-a-receber');
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
            clienteNome: item.clienteNome,
            origem: item.origem,
            vencimento: item.dataVencimento,
            valorTotal: item.valorTotal,
            valorRecebido: item.valorRecebido,
            valorRestante: item.valorRestante,
            status: item.status.replace('_', ' '),
            dadosCompletos: item
        }));

        if ($.fn.DataTable.isDataTable('#tabela-contas')) {
            tabelaContas.clear().rows.add(dadosMapeados).draw();
        } else {
            tabelaContas = $('#tabela-contas').DataTable({
                data: dadosMapeados,
                columns: [
                    { data: "id" },
                    { data: "clienteNome" },
                    { data: "origem" },
                    { data: "vencimento", render: formatarData },
                    { data: "valorTotal", render: formatarMoeda },
                    { data: "valorRecebido", render: formatarMoeda },
                    { data: "valorRestante", render: formatarMoeda },
                    {
                        data: "status",
                        render: function (data) {
                            const s = { 'A RECEBER': 'status-areceber', 'PARCIALMENTE PAGO': 'status-parcial', 'RECEBIDO': 'status-recebido' };
                            return `<span class="status-badge ${s[data] || ''}">${data}</span>`;
                        }
                    },
                    {
                        data: null,
                        title: "Ações",
                        render: function (data, type, row) {
                            let btnPagar = row.dadosCompletos.status !== 'RECEBIDO' ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${row.id}" title="Pagar"><i class="bi bi-currency-dollar"></i></button>` : '';
                            return `<div class="btn-group" role="group"><button class="btn btn-sm btn-info btn-detalhes" data-id="${row.id}" title="Detalhes"><i class="bi bi-eye"></i></button>${btnPagar}<button class="btn btn-sm btn-warning btn-editar" data-id="${row.id}" title="Editar"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger btn-excluir" data-id="${row.id}" title="Excluir"><i class="bi bi-trash"></i></button></div>`;
                        },
                        orderable: false,
                        width: "150px"
                    }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                order: [[3, 'asc']]
            });
            
            tabelaContas.on('draw.dt', function() {
                atualizarTotalFiltrado();
            });
        }
        aplicarFiltros(false); 
    }
    
    function atualizarTotalFiltrado() {
        const container = $('#totalFiltradoContainer');
        const valorSpan = $('#totalFiltradoValor');

        const isFiltroAtivo = $('#filtroTexto').val() || $('#filtroDataInicio').val() || $('#filtroDataFim').val() || $('#filtroStatus').val();

        if (!isFiltroAtivo) {
            container.hide();
            return;
        }

        const dadosFiltradosApi = tabelaContas.rows({ search: 'applied' });
        const dadosFiltrados = dadosFiltradosApi.data().toArray();
        let total = dadosFiltrados.reduce((sum, item) => sum + (item.valorRestante || 0), 0);

        valorSpan.text(formatarMoeda(total));
        container.show();
    }


    function atualizarDashboard(dados) {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        let aReceber = dados.filter(c => c.status !== 'RECEBIDO').reduce((acc, c) => acc + c.valorRestante, 0);
        let recebidoMes = dados.filter(c => c.status === 'RECEBIDO').reduce((acc, c) => acc + c.valorRecebido, 0);
        let vencido = dados.filter(c => c.status !== 'RECEBIDO' && new Date(c.dataVencimento) < hoje).reduce((acc, c) => acc + c.valorRestante, 0);
        
        $('#totalAReceber').text(formatarMoeda(aReceber));
        $('#totalRecebidoMes').text(formatarMoeda(recebidoMes));
        $('#totalVencido').text(formatarMoeda(vencido));
    }

    function aplicarFiltros(fecharModal = true) {
        const texto = $('#filtroTexto').val().toLowerCase();
        const dataInicio = $('#filtroDataInicio').val();
        const dataFim = $('#filtroDataFim').val();
        const status = $('#filtroStatus').val();
    
        $.fn.dataTable.ext.search.pop(); 
    
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                const cliente = data[1].toLowerCase();
                const origem = data[2].toLowerCase();
                const statusTabela = data[7];
                const vencimento = tabelaContas.row(dataIndex).data().vencimento;
                
                const textoValido = !texto || cliente.includes(texto) || origem.includes(texto);
                const dataValida = (!dataInicio || vencimento >= dataInicio) && (!dataFim || vencimento <= dataFim);
                const statusValido = !status || statusTabela === status;
    
                return textoValido && dataValida && statusValido;
            }
        );
        
        tabelaContas.draw();
    
        if(fecharModal) {
            filtroModal.hide();
        }
    }

    $('#btnAbrirFiltros').on('click', () => filtroModal.show());
    $('#btnAplicarFiltros').on('click', () => aplicarFiltros(true));
    $('#btnLimparFiltros').on('click', () => {
        $('#formFiltro')[0].reset();
        aplicarFiltros(true);
    });
    
    $('#btnNovaConta').on('click', function() {
        $('#formConta')[0].reset();
        $('#contaIdForm').val('');
        clienteSelect.val(null).trigger('change').prop('disabled', false);
        nomeAvulsoInput.prop('disabled', false);
        $('#contaModalLabel').text('Nova Conta a Receber');
        contaModal.show();
    });

    $('#tabela-contas tbody').on('click', 'button', function () {
        const id = $(this).data('id');
        const dadosLinha = todosOsDados.find(d => d.id == id);
        if (!dadosLinha) return;

        if ($(this).hasClass('btn-detalhes')) {
            $('#detalhesId').text(dadosLinha.id);
            $('#detalhesCliente').text(dadosLinha.clienteNome);
            $('#detalhesOrigem').text(dadosLinha.origem);
            $('#detalhesVencimento').text(formatarData(dadosLinha.dataVencimento));
            $('#detalhesValorTotal').text(formatarMoeda(dadosLinha.valorTotal));
            $('#detalhesValorPago').text(formatarMoeda(dadosLinha.valorRecebido));
            $('#detalhesValorRestante').text(formatarMoeda(dadosLinha.valorRestante));
            const statusFormatado = dadosLinha.status.replace('_', ' ');
            $('#detalhesStatus').html(`<span class="status-badge ${ { 'A RECEBER': 'status-areceber', 'PARCIALMENTE PAGO': 'status-parcial', 'RECEBIDO': 'status-recebido' }[statusFormatado] || ''}">${statusFormatado}</span>`);
            detalhesModal.show();
        } else if ($(this).hasClass('btn-pagar')) {
            $('#contaId').val(id);
            $('#modalClienteNome').text(dadosLinha.clienteNome);
            $('#modalValorRestante').text(formatarMoeda(dadosLinha.valorRestante));
            $('#valorPago').val(dadosLinha.valorRestante.toFixed(2));
            $('#dataPagamento').val(new Date().toISOString().slice(0, 10));
            pagamentoModal.show();
        } else if ($(this).hasClass('btn-editar')) {
            $('#formConta')[0].reset();
            $('#contaIdForm').val(dadosLinha.id);
            $('#contaModalLabel').text(`Editar Conta #${dadosLinha.id}`);
            
            nomeAvulsoInput.prop('disabled', false).val('');
            clienteSelect.prop('disabled', false).val(null).trigger('change');

            if (dadosLinha.clienteId) {
                const option = new Option(dadosLinha.clienteNome, dadosLinha.clienteId, true, true);
                clienteSelect.append(option).trigger('change');
                nomeAvulsoInput.prop('disabled', true);
            } else {
                nomeAvulsoInput.val(dadosLinha.clienteNome);
                clienteSelect.prop('disabled', true);
            }

            $('#contaValor').val(dadosLinha.valorTotal.toFixed(2));
            $('#contaVencimento').val(formatarDataParaInput(dadosLinha.dataVencimento));
            $('#contaOrigem').val(dadosLinha.origem);
            contaModal.show();
        } else if ($(this).hasClass('btn-excluir')) {
            Swal.fire({
                title: 'Tem certeza?',
                text: `Deseja realmente excluir a conta #${id} (${dadosLinha.origem})?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonText: 'Cancelar',
                confirmButtonText: 'Sim, excluir!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetchWithAuth(`/api/contas-a-receber/${id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Falha ao excluir.');
                        Swal.fire('Excluído!', 'A conta foi removida.', 'success');
                        carregarContas();
                    } catch(err) {
                        Swal.fire('Erro!', 'Não foi possível excluir a conta.', 'error');
                    }
                }
            });
        }
    });

    $('#formPagamento').on('submit', async function(e) {
        e.preventDefault();
        const contaId = $('#contaId').val();
        const valorPago = $('#valorPago').val();
        const dataPagamento = $('#dataPagamento').val();
        const payload = { valor: parseFloat(valorPago), dataPagamento: dataPagamento };
        try {
            const response = await fetchWithAuth(`/api/contas-a-receber/${contaId}/registrar-pagamento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Falha ao registrar o pagamento.');
            pagamentoModal.hide();
            Swal.fire('Sucesso!', 'Pagamento registrado com sucesso!', 'success');
            carregarContas();
        } catch (error) {
            Swal.fire('Erro!', `Não foi possível registrar o pagamento: ${error.message}`, 'error');
        }
    });

    $('#formConta').on('submit', async function(e) {
        e.preventDefault();
        const id = $('#contaIdForm').val();
        const url = id ? `/api/contas-a-receber/${id}` : '/api/contas-a-receber';
        const method = id ? 'PUT' : 'POST';

        const payload = {
            clienteId: $('#contaClienteSelect').val() ? parseInt($('#contaClienteSelect').val()) : null,
            clienteNomeAvulso: $('#contaClienteNomeAvulso').val(),
            origem: $('#contaOrigem').val(),
            valorTotal: parseFloat($('#contaValor').val()),
            dataVencimento: $('#contaVencimento').val()
        };
        
        if (!payload.clienteId && !payload.clienteNomeAvulso) {
            Swal.fire('Atenção!', 'Selecione um cliente cadastrado ou digite o nome de um cliente avulso.', 'warning');
            return;
        }
        if (!payload.origem || !payload.valorTotal || !payload.dataVencimento) {
            Swal.fire('Atenção!', 'Preencha os campos de Valor, Vencimento e Origem.', 'warning');
            return;
        }

        try {
            const response = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Falha ao salvar a conta.`);
            contaModal.hide();
            Swal.fire('Sucesso!', 'Conta salva com sucesso!', 'success');
            carregarContas();
        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    });

    carregarContas();
});