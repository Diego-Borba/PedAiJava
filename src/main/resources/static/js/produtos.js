document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];

    // --- Funções de Manipulação do Modal de Edição ---
    function adicionarLinhaComplementoConfigEdit(config = { complementoProdutoId: '', maxQtdePermitida: 1 }) {
        const container = document.getElementById('edit-listaComplementosConfig');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center edit-comp-config-row';
        let selectOptions = '<option value="">Selecione um Produto Complemento</option>';
        todosOsProdutosParaSelecao.forEach(p => {
             if (p.isComplemento) { // Apenas complementos podem ser selecionados aqui
                selectOptions += `<option value="${p.id}" ${config.complementoProdutoId == p.id ? 'selected' : ''}>${p.nome} (ID: ${p.id})</option>`;
            }
        });
        div.innerHTML = `
            <div class="col-md-6"><select class="form-select form-select-sm edit-complemento-id-select" required>${selectOptions}</select></div>
            <div class="col-md-4"><input type="number" class="form-control form-control-sm edit-complemento-qtde-max-input" placeholder="Qtde Máx." value="${config.maxQtdePermitida || 1}" min="1" required></div>
            <div class="col-md-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-edit-comp-config"><i class="bi bi-trash"></i></button></div>`;
        container.appendChild(div);
        div.querySelector('.btn-remover-edit-comp-config').addEventListener('click', function() { this.closest('.edit-comp-config-row').remove(); });
    }

    function adicionarLinhaReceitaEdit(item = { produtoIngredienteId: '', quantidadeUtilizada: '' }) {
        const container = document.getElementById('edit-listaReceita');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'row g-2 mb-2 align-items-center edit-receita-item-row';
        let selectOptions = '<option value="">Selecione um Ingrediente</option>';
        todosOsProdutosParaSelecao.forEach(p => {
            // Apenas matérias-primas ou outros produtos que não são principais podem ser ingredientes
            if (p.isMateriaPrima || p.isComplemento) { 
                selectOptions += `<option value="${p.id}" ${item.produtoIngredienteId == p.id ? 'selected' : ''}>${p.nome} (ID: ${p.id})</option>`;
            }
        });
        div.innerHTML = `
            <div class="col-md-6"><select class="form-select form-select-sm edit-ingrediente-id-select" required>${selectOptions}</select></div>
            <div class="col-md-4"><input type="number" step="0.001" class="form-control form-control-sm edit-ingrediente-qtde-input" placeholder="Qtde. Utilizada" value="${item.quantidadeUtilizada || ''}" required></div>
            <div class="col-md-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-edit-receita-item"><i class="bi bi-trash"></i></button></div>`;
        container.appendChild(div);
        div.querySelector('.btn-remover-edit-receita-item').addEventListener('click', function() { this.closest('.edit-receita-item-row').remove(); });
    }

    // --- Carga Inicial e DataTable ---
    function carregarProdutos() {
        fetch('/api/produtos')
            .then(res => res.json())
            .then(data => {
                todosOsProdutosParaSelecao = data;
                if ($.fn.DataTable.isDataTable('#tabela-produtos')) {
                    tabela.clear().rows.add(data).draw();
                } else {
                    tabela = $('#tabela-produtos').DataTable({
                        data: data,
                        columns: [
                            {
                                data: null, title: "Nome / Tipo",
                                render: function (d, t, row) {
                                    let tipo = '';
                                    if (row.isMateriaPrima) tipo = '<span class="badge bg-success">Matéria-Prima</span>';
                                    else if (row.receita && row.receita.length > 0) tipo = '<span class="badge bg-secondary">Composto</span>';
                                    else if (row.isComplemento) tipo = '<span class="badge bg-info text-dark">Complemento</span>';
                                    else tipo = '<span class="badge bg-primary">Venda Direta</span>';
                                    return `${row.nome || 'N/A'} ${tipo}`;
                                }
                            },
                            { data: "preco", title: "Preço", render: (d) => `R$ ${d ? d.toFixed(2) : '0.00'}` },
                            { 
                                data: "estoqueAtual", title: "Estoque", 
                                render: function(d) {
                                    const estoque = d != null ? parseFloat(d).toFixed(3) : '0.000';
                                    const cor = estoque > 10 ? 'bg-success' : (estoque > 0 ? 'bg-warning text-dark' : 'bg-danger');
                                    return `<span class="badge ${cor}" style="font-size: 0.9em;">${estoque}</span>`;
                                }
                            },
                            { data: "categoria", title: "Categoria", defaultContent: "N/A" },
                            { data: "qtdeMax", title: "Qtde.Máx Pedido", defaultContent: "N/A" },
                            { data: null, title: "Info Adicional", render: (d, t, row) => `CódPdv: ${row.codPdv || 'N/A'} / Ordem: ${row.ordemVisualizacao || 'N/A'}` },
                            {
                                data: "id", title: "Ações",
                                render: () => `<button class="btn btn-sm btn-warning btn-editar" title="Editar"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-danger btn-excluir" title="Excluir"><i class="bi bi-trash"></i></button>`,
                                orderable: false
                            }
                        ],
                        createdRow: (row, data) => $(row).attr('data-id', data.id),
                        language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                        order: [[0, 'asc']]
                    });
                }
            }).catch(err => Swal.fire('Erro!', 'Não foi possível carregar os produtos.', 'error'));
    }

    // --- Event Listeners ---
    $('#tabela-produtos tbody').on('click', '.btn-editar, .btn-excluir', function () {
        const row = $(this).closest('tr');
        const id = tabela.row(row).data().id;

        if ($(this).hasClass('btn-editar')) {
            fetch(`/api/produtos/${id}`).then(res => res.json()).then(p => {
                $('#edit-id').val(p.id);
                $('#edit-nome').val(p.nome || '');
                $('#edit-preco').val(p.preco || '');
                $('#edit-categoria').val(p.categoria || '');
                $('#edit-qtdeMax').val(p.qtdeMax || '');
                $('#edit-codigoPdv').val(p.codPdv || '');
                $('#edit-descricao').val(p.descricao || '');
                $('#edit-imagem').val(p.imagem || '');
                $('#edit-ordemVisualizacao').val(p.ordemVisualizacao || '');
                
                $('#edit-isMateriaPrima').prop('checked', p.isMateriaPrima).trigger('change');
                $('#edit-isComplemento').prop('checked', p.isComplemento);
                $('#edit-permiteComplementos').prop('checked', p.permiteComplementos).trigger('change');

                $('#edit-listaComplementosConfig').empty();
                if (p.permiteComplementos && p.complementosDisponiveis) {
                    p.complementosDisponiveis.forEach(config => adicionarLinhaComplementoConfigEdit(config));
                }
                
                $('#edit-listaReceita').empty();
                if (p.receita && p.receita.length > 0) {
                    p.receita.forEach(item => adicionarLinhaReceitaEdit(item));
                }
                
                new bootstrap.Modal($('#editModal')[0]).show();
            }).catch(err => Swal.fire('Erro!', 'Não foi possível carregar dados do produto.', 'error'));
        } else if ($(this).hasClass('btn-excluir')) {
            const nomeProduto = tabela.row(row).data().nome;
            Swal.fire({
                title: `Deseja excluir "${nomeProduto}"?`,
                text: "A ação não pode ser revertida!",
                icon: 'warning', showCancelButton: true,
                confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir!', cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`/api/produtos/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) throw new Error('Falha ao excluir.');
                            Swal.fire('Excluído!', 'Produto excluído.', 'success');
                            carregarProdutos();
                        })
                        .catch(err => Swal.fire('Erro!', 'Não foi possível excluir.', 'error'));
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

    $('#edit-isMateriaPrima').on('change', function() {
        $('#edit-containerReceita').toggle(!this.checked);
        if(this.checked) $('#edit-listaReceita').empty();
    });

    $('#edit-btnAddComplementoConfig').on('click', () => adicionarLinhaComplementoConfigEdit());
    $('#edit-btnAddReceita').on('click', () => adicionarLinhaReceitaEdit());

    $('#formEditProduto').on('submit', function (e) {
        e.preventDefault();
        
        const complementosDisponiveisEdit = [];
        if ($('#edit-permiteComplementos').is(':checked')) {
            $('#edit-listaComplementosConfig .edit-comp-config-row').each(function() {
                const idSelect = $(this).find('.edit-complemento-id-select');
                const qtdeInput = $(this).find('.edit-complemento-qtde-max-input');
                if (idSelect.val() && qtdeInput.val()) {
                    complementosDisponiveisEdit.push({ complementoProdutoId: parseInt(idSelect.val()), maxQtdePermitida: parseInt(qtdeInput.val()) });
                }
            });
        }
        
        const receitaEdit = [];
        if (!$('#edit-isMateriaPrima').is(':checked')) {
            $('#edit-listaReceita .edit-receita-item-row').each(function() {
                const idSelect = $(this).find('.edit-ingrediente-id-select');
                const qtdeInput = $(this).find('.edit-ingrediente-qtde-input');
                if (idSelect.val() && qtdeInput.val()) {
                    receitaEdit.push({ produtoIngredienteId: parseInt(idSelect.val()), quantidadeUtilizada: parseFloat(qtdeInput.val()) });
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
            isMateriaPrima: $('#edit-isMateriaPrima').is(':checked'),
            isComplemento: $('#edit-isComplemento').is(':checked'),
            permiteComplementos: $('#edit-permiteComplementos').is(':checked'),
            complementosDisponiveis: complementosDisponiveisEdit,
            receita: receitaEdit,
            ativo: true
        };

        fetch(`/api/produtos/${produto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        }).then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Erro no servidor') });
            bootstrap.Modal.getInstance($('#editModal')[0]).hide();
            Swal.fire('Sucesso!', 'Produto atualizado!', 'success').then(() => carregarProdutos());
        }).catch(err => Swal.fire('Erro!', `Não foi possível atualizar: ${err.message}`, 'error'));
    });

    carregarProdutos();
});