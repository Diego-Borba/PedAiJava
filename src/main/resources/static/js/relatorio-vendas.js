// src/main/resources/static/js/relatorio-vendas.js
document.addEventListener('DOMContentLoaded', function () {
    const filtroForm = document.getElementById('filtro-form');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
    let tabelaRelatorio;

    const inicializarSelect2 = (selector, placeholder, url) => {
        $(selector).select2({
            theme: 'bootstrap-5',
            placeholder: placeholder,
            allowClear: true,
            ajax: {
                url: url,
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
            }
        });
    };

    inicializarSelect2('#filtro-cliente', 'Todos os clientes', '/api/clientes/search');
    inicializarSelect2('#filtro-produto', 'Todos os produtos', '/api/produtos/search');

    const inicializarTabela = () => {
        tabelaRelatorio = $('#tabela-relatorio-vendas').DataTable({
            language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
            processing: true,
            serverSide: false,
            ajax: {
                url: '/api/relatorios/vendas',
                type: 'GET',
                beforeSend: function (request) {
                    const token = localStorage.getItem('jwt_token');
                    if (token) {
                        request.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                },
                data: function (d) {
                    d.clienteId = $('#filtro-cliente').val();
                    d.produtoId = $('#filtro-produto').val();
                    d.formaPagamento = $('#filtro-pagamento').val();
                    const dataInicial = $('#filtro-data-inicial').val();
                    if (dataInicial) d.dataInicial = new Date(dataInicial + "T00:00:00").toISOString();
                    const dataFinal = $('#filtro-data-final').val();
                    if (dataFinal) d.dataFinal = new Date(dataFinal + "T23:59:59").toISOString();
                },
                dataSrc: ''
            },
            columns: [
                { data: 'id' },
                { data: 'dataVenda', render: (data) => data ? new Date(data).toLocaleString('pt-BR') : '' },
                { data: 'clienteNome' },
                { data: 'itens', render: (data) => `<ul>${data.map(item => `<li>${item}</li>`).join('')}</ul>` },
                { data: 'formasPagamento', render: (data) => data.join(', ') },
                { data: 'total', render: (data) => `R$ ${data.toFixed(2)}` },
                // --- NOVA COLUNA DE AÇÕES ---
                {
                    data: 'id',
                    orderable: false,
                    render: function (data) {
                        return `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info btn-detalhes" data-id="${data}" title="Detalhes"><i class="bi bi-eye"></i></button>
                                <button class="btn btn-danger btn-excluir" data-id="${data}" title="Excluir"><i class="bi bi-trash"></i></button>
                            </div>
                        `;
                    }
                }
            ],
            order: [[1, 'desc']],
            footerCallback: function (row, data, start, end, display) {
                var api = this.api();
                const totalFiltrado = api.column(5, { search: 'applied' }).data().reduce((a, b) => a + parseFloat(b.toString().replace('R$ ', '')), 0);
                $(api.column(5).footer()).html(`R$ ${totalFiltrado.toFixed(2)}`);
            }
        });
    };
    
    // --- LÓGICA DOS BOTÕES DE AÇÃO ---
    $('#tabela-relatorio-vendas tbody').on('click', 'button', function () {
        const id = $(this).data('id');
        if ($(this).hasClass('btn-detalhes')) {
            handleDetalhesVenda(id);
        } else if ($(this).hasClass('btn-excluir')) {
            handleExcluirVenda(id);
        }
    });

    async function handleDetalhesVenda(id) {
        try {
            const response = await fetchWithAuth(`/api/vendas/${id}`);
            if (!response.ok) throw new Error('Venda não encontrada.');
            const venda = await response.json();

            const itensHtml = venda.itens.map(item => 
                `<li>${item.quantidade}x ${item.nome} - R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}</li>`
            ).join('');
            const pagamentosHtml = venda.pagamentos.map(p => `<li>${p.forma.replace('_', ' ')}: R$ ${p.valor.toFixed(2)}</li>`).join('');

            Swal.fire({
                title: `Detalhes da Venda #${venda.id}`,
                html: `
                    <div style="text-align: left;">
                        <p><strong>Data:</strong> ${new Date(venda.dataVenda).toLocaleString('pt-BR')}</p>
                        <p><strong>Cliente:</strong> ${venda.clienteNome}</p>
                        <hr>
                        <h6>Itens:</h6>
                        <ul class="list-unstyled">${itensHtml}</ul>
                        <hr>
                        <p><strong>Subtotal:</strong> R$ ${venda.subtotal.toFixed(2)}</p>
                        <p class="text-danger"><strong>Desconto:</strong> - R$ ${venda.desconto.toFixed(2)}</p>
                        <p class="text-success"><strong>Acréscimo:</strong> + R$ ${venda.acrescimo.toFixed(2)}</p>
                        <h5><strong>Total:</strong> R$ ${venda.total.toFixed(2)}</h5>
                        <hr>
                        <h6>Pagamentos:</h6>
                        <ul class="list-unstyled">${pagamentosHtml}</ul>
                    </div>
                `,
                icon: 'info'
            });
        } catch (error) {
            Swal.fire('Erro!', error.message, 'error');
        }
    }

    async function handleExcluirVenda(id) {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: `Deseja realmente excluir a venda #${id}? Esta ação não pode ser revertida.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim, excluir!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetchWithAuth(`/api/vendas/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Falha ao excluir a venda.');
                
                Swal.fire('Excluído!', 'A venda foi removida com sucesso.', 'success');
                tabelaRelatorio.ajax.reload(); // Recarrega a tabela
            } catch (error) {
                Swal.fire('Erro!', error.message, 'error');
            }
        }
    }

    filtroForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (tabelaRelatorio) {
            tabelaRelatorio.ajax.reload();
        } else {
            inicializarTabela();
        }
    });

    btnLimpar.addEventListener('click', function () {
        filtroForm.reset();
        $('#filtro-cliente').val(null).trigger('change');
        $('#filtro-produto').val(null).trigger('change');
        if(tabelaRelatorio) {
            tabelaRelatorio.ajax.reload();
        }
    });

    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-data-inicial').value = hoje;
    document.getElementById('filtro-data-final').value = hoje;
    inicializarTabela();
});