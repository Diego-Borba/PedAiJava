document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];

    function adicionarLinhaComplementoConfigEdit(config = { complementoProdutoId: '', maxQtdePermitida: 1 }) {
        const container = document.getElementById('edit-listaComplementosConfig');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center edit-comp-config-row';
        let selectOptions = '<option value="">Selecione um Produto Complemento</option>';
        todosOsProdutosParaSelecao.forEach(p => {
            selectOptions += `<option value="${p.id}" ${config.complementoProdutoId && p.id == config.complementoProdutoId ? 'selected' : ''}>${p.nome} (ID: ${p.id})</option>`;
        });
        div.innerHTML = `
            <div class="col-md-6">
                <select class="form-select form-select-sm edit-complemento-id-select" required>${selectOptions}</select>
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control form-control-sm edit-complemento-qtde-max-input" placeholder="Qtde Máx." value="${config.maxQtdePermitida || 1}" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-danger w-100 btn-remover-edit-comp-config"><i class="bi bi-trash"></i></button>
            </div>`;
        container.appendChild(div);
        div.querySelector('.btn-remover-edit-comp-config').addEventListener('click', function() {
            this.closest('.edit-comp-config-row').remove();
        });
    }

    function carregarProdutos() {
        fetch('/api/produtos')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                todosOsProdutosParaSelecao = data;

                // --- LÓGICA DE ATUALIZAÇÃO DA DATATABLE REFEITA ---
                if ($.fn.DataTable.isDataTable('#tabela-produtos')) {
                    // Se a tabela já existe, limpa, adiciona os novos dados e redesenha
                    tabela.clear().rows.add(data).draw();
                } else {
                    // Se a tabela não existe, inicializa pela primeira vez
                    tabela = $('#tabela-produtos').DataTable({
                        data: data,
                        columns: [
                            {
                                data: null,
                                title: "Nome / Tipo",
                                render: function(data, type, row) {
                                    let tipoProduto = '';
                                    if (row.permiteComplementos) tipoProduto = '<span class="badge bg-primary">Principal</span>';
                                    if (row.isComplemento) tipoProduto += (tipoProduto ? ' ' : '') + '<span class="badge bg-info text-dark">Complemento</span>';
                                    if (!tipoProduto) tipoProduto = '<span class="badge bg-secondary">Padrão</span>';
                                    return `${row.nome || 'N/A'} ${tipoProduto}`;
                                }
                            },
                            {
                                data: "preco",
                                title: "Preço",
                                render: function(data, type, row) {
                                    return `R$ ${data ? data.toFixed(2) : '0.00'}`;
                                }
                            },
                            { data: "categoria", title: "Categoria", defaultContent: "N/A" },
                            { data: "qtdeMax", title: "Qtde.Máx Pedido", defaultContent: "N/A" },
                            {
                                data: null,
                                title: "Info Adicional",
                                render: function(data, type, row) {
                                    const codPdv = row.codPdv != null ? row.codPdv : 'N/A';
                                    const ordem = row.ordemVisualizacao != null ? row.ordemVisualizacao : 'N/A';
                                    return `CódPdv: ${codPdv} / Ordem: ${ordem}`;
                                }
                            },
                            {
                                data: "id",
                                title: "Ações",
                                render: function(data, type, row) {
                                    return `<button class="btn btn-sm btn-warning btn-editar" title="Editar"><i class="bi bi-pencil"></i></button>
                                            <button class="btn btn-sm btn-danger btn-excluir" title="Excluir"><i class="bi bi-trash"></i></button>`;
                                },
                                orderable: false
                            }
                        ],
                        createdRow: function(row, data, dataIndex){
                             $(row).attr('data-id', data.id);
                        },
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                        responsive: true,
                        order: [[0, 'asc']]
                    });
                }
            })
            .catch(error => {
                console.error("Erro ao carregar produtos:", error);
                Swal.fire('Erro!', 'Não foi possível carregar os produtos.', 'error');
            });
    }

    // O event listener para os botões continua o mesmo, pois usa delegação de eventos
    $('#produtos').on('click', '.btn-editar, .btn-excluir', function (e) {
        const row = $(this).closest('tr');
        const id = row.data('id');

        if ($(this).hasClass('btn-editar')) {
            fetch(`/api/produtos/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Produto não encontrado ou erro na API');
                    return res.json();
                })
                .then(p => {
                    $('#edit-id').val(p.id);
                    $('#edit-nome').val(p.nome || '');
                    $('#edit-preco').val(p.preco || '');
                    $('#edit-categoria').val(p.categoria || '');
                    $('#edit-qtdeMax').val(p.qtdeMax || '');
                    $('#edit-codigoPdv').val(p.codPdv || '');
                    $('#edit-descricao').val(p.descricao || '');
                    $('#edit-imagem').val(p.imagem || '');
                    $('#edit-ordemVisualizacao').val(p.ordemVisualizacao || '');
                    
                    $('#edit-isComplemento').prop('checked', p.isComplemento);
                    $('#edit-permiteComplementos').prop('checked', p.permiteComplementos).trigger('change');

                    const listaEditComplementos = $('#edit-listaComplementosConfig').empty();
                    if (p.permiteComplementos && p.complementosDisponiveis && p.complementosDisponiveis.length > 0) {
                        p.complementosDisponiveis.forEach(config => adicionarLinhaComplementoConfigEdit(config));
                    }
                    new bootstrap.Modal($('#editModal')[0]).show();
                })
                .catch(err => Swal.fire('Erro!', 'Não foi possível carregar dados do produto.', 'error'));
        } else if ($(this).hasClass('btn-excluir')) {
            const nomeProduto = row.find('td:first').text().split('<span')[0].trim();
            Swal.fire({
                title: `Tem certeza que deseja excluir "${nomeProduto}"?`,
                text: "Esta ação não poderá ser revertida!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`/api/produtos/${id}`, { method: 'DELETE' })
                    .then(res => {
                        if (!res.ok) throw new Error('Falha ao excluir o produto.');
                        Swal.fire('Excluído!', 'Produto excluído com sucesso.', 'success');
                        carregarProdutos();
                    })
                    .catch(err => Swal.fire('Erro!', 'Não foi possível excluir o produto.', 'error'));
                }
            });
        }
    });
    
    $('#edit-permiteComplementos').on('change', function() {
        $('#edit-containerComplementosDisponiveis').toggle(this.checked);
        if (this.checked && $('#edit-listaComplementosConfig').children().length === 0) {
            adicionarLinhaComplementoConfigEdit();
        }
    });

    $('#edit-btnAddComplementoConfig').on('click', () => adicionarLinhaComplementoConfigEdit());

    $('#formEditProduto').on('submit', function (e) {
        e.preventDefault();

        if ($('#edit-isComplemento').is(':checked') && $('#edit-permiteComplementos').is(':checked')) {
            Swal.fire('Atenção!', 'Um produto não pode ser um "complemento" e ao mesmo tempo "permitir complementos".', 'warning');
            return;
        }

        const complementosDisponiveisEdit = [];
        if ($('#edit-permiteComplementos').is(':checked')) {
            $('#edit-listaComplementosConfig .edit-comp-config-row').each(function() {
                const idSelect = $(this).find('.edit-complemento-id-select');
                const qtdeInput = $(this).find('.edit-complemento-qtde-max-input');
                if (idSelect.val() && qtdeInput.val()) {
                    complementosDisponiveisEdit.push({
                        complementoProdutoId: parseInt(idSelect.val()),
                        maxQtdePermitida: parseInt(qtdeInput.val())
                    });
                }
            });
        }
        
        const produto = {
            id: $('#edit-id').val(),
            nome: $('#edit-nome').val(),
            preco: parseFloat($('#edit-preco').val()),
            categoria: $('#edit-categoria').val(),
            qtdeMax: parseInt($('#edit-qtdeMax').val()),
            codPdv: $('#edit-codigoPdv').val() ? parseInt($('#edit-codigoPdv').val()) : null,
            descricao: $('#edit-descricao').val(),
            imagem: $('#edit-imagem').val(),
            ordemVisualizacao: $('#edit-ordemVisualizacao').val() ? parseInt($('#edit-ordemVisualizacao').val()) : null,
            isComplemento: $('#edit-isComplemento').is(':checked'),
            permiteComplementos: $('#edit-permiteComplementos').is(':checked'),
            complementosDisponiveis: complementosDisponiveisEdit,
            ativo: true
        };

        fetch(`/api/produtos/${produto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        }).then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Erro no servidor') });
            bootstrap.Modal.getInstance($('#editModal')[0]).hide();
            Swal.fire('Sucesso!', 'Produto atualizado com sucesso!', 'success')
                .then(() => carregarProdutos());
        }).catch(err => Swal.fire('Erro!', `Não foi possível atualizar: ${err.message}`, 'error'));
    });

    // Carga inicial dos produtos
    carregarProdutos();
});