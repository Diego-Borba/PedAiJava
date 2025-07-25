document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];

    // --- Funções de Manipulação do Modal de Edição ---

    // Adiciona uma linha de grupo de kit no modal de edição
    function adicionarLinhaGrupoKitEdit(grupo = {}) {
        const container = document.getElementById('edit-listaGruposKit');
        if (!container) return;

        const divGrupo = document.createElement('div');
        divGrupo.className = 'p-3 border rounded mb-3 bg-white shadow-sm edit-grupo-kit-bloco';
        divGrupo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Grupo</h6>
                <button type="button" class="btn btn-sm btn-outline-danger btn-remover-grupo-edit">Remover Grupo</button>
            </div>
            <div class="row g-3">
                <div class="col-md-12"><label class="form-label small">Nome do Grupo</label><input type="text" class="form-control form-control-sm edit-nome-grupo-kit" required value="${grupo.nome || ''}"></div>
                <div class="col-md-6">
                    <label class="form-label small">Tipo de Seleção</label>
                    <select class="form-select form-select-sm edit-tipo-selecao-grupo-kit" required>
                        <option value="ESCOLHA_UNICA" ${grupo.tipoSelecao === 'ESCOLHA_UNICA' ? 'selected' : ''}>Escolha Única</option>
                        <option value="QUANTIDADE_TOTAL" ${grupo.tipoSelecao === 'QUANTIDADE_TOTAL' ? 'selected' : ''}>Quantidade Total</option>
                    </select>
                </div>
                <div class="col-md-6"><label class="form-label small">Qtde Máx</label><input type="number" class="form-control form-control-sm edit-qtde-max-grupo-kit" value="${grupo.quantidadeMaxima || 1}" min="1"></div>
            </div>
            <hr>
            <label class="form-label small fw-bold">Opções para este Grupo:</label>
            <div class="edit-lista-opcoes-kit mb-2"></div>
            <button type="button" class="btn btn-sm btn-outline-success btn-add-opcao-kit-edit"><i class="bi bi-plus"></i> Adicionar Opção</button>
        `;
        container.appendChild(divGrupo);

        // Popula as opções existentes
        const containerOpcoes = divGrupo.querySelector('.edit-lista-opcoes-kit');
        if (grupo.opcoes && grupo.opcoes.length > 0) {
            grupo.opcoes.forEach(opcao => adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao));
        }

        // Adiciona listeners para os botões
        divGrupo.querySelector('.btn-remover-grupo-edit').addEventListener('click', function () { this.closest('.edit-grupo-kit-bloco').remove(); });
        divGrupo.querySelector('.btn-add-opcao-kit-edit').addEventListener('click', function () { adicionarLinhaOpcaoKitEdit(this.previousElementSibling); });
    }

    // Adiciona uma linha de opção/sabor dentro de um grupo no modal de edição
    function adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao = {}) {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'row g-2 mb-2 align-items-center edit-opcao-kit-bloco';

        let optionsHTML = '<option value="">Selecione um produto...</option>';
        todosOsProdutosParaSelecao.forEach(p => {
            if (p.isMateriaPrima || p.isComplemento) {
                const isSelected = opcao.produto && p.id == opcao.produto.id ? 'selected' : '';
                optionsHTML += `<option value="${p.id}" ${isSelected}>${p.nome}</option>`;
            }
        });

        divOpcao.innerHTML = `
            <div class="col-10"><select class="form-select form-select-sm edit-produto-id-opcao-kit" required>${optionsHTML}</select></div>
            <div class="col-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-opcao-edit"><i class="bi bi-trash"></i></button></div>`;
        containerOpcoes.appendChild(divOpcao);
        divOpcao.querySelector('.btn-remover-opcao-edit').addEventListener('click', function () { this.closest('.edit-opcao-kit-bloco').remove(); });
    }


    // --- Carga Inicial e DataTable ---
    function carregarProdutos() {
        fetch('/api/produtos')
            .then(res => res.json())
            .then(data => {
                todosOsProdutosParaSelecao = data; // Cache dos produtos para selects
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
                                    if (row.isKit) tipo = '<span class="badge bg-purple">Kit</span>';
                                    else if (row.isMateriaPrima) tipo = '<span class="badge bg-success">Matéria-Prima</span>';
                                    else if (row.isComplemento) tipo = '<span class="badge bg-info text-dark">Complemento</span>';
                                    else if (row.receita && row.receita.length > 0) tipo = '<span class="badge bg-secondary">Composto</span>';
                                    else tipo = '<span class="badge bg-primary">Venda Direta</span>';
                                    return `${row.nome || 'N/A'} ${tipo}`;
                                }
                            },
                            { data: "preco", title: "Preço", render: (d) => `R$ ${d ? d.toFixed(2) : '0.00'}` },
                            { data: "estoqueAtual", title: "Estoque", render: function(d) {
                                    const estoque = d != null ? parseFloat(d).toFixed(3) : 'N/A';
                                    const cor = estoque > 10 ? 'bg-success' : (estoque > 0 ? 'bg-warning text-dark' : 'bg-danger');
                                    return `<span class="badge ${cor}" style="font-size: 0.9em;">${estoque}</span>`;
                                }
                            },
                            { data: "categoria", title: "Categoria", defaultContent: "N/A" },
                            { data: null, title: "Info Adicional", render: (d, t, row) => `CódPdv: ${row.codPdv || 'N/A'}` },
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
    $('#tabela-produtos tbody').on('click', '.btn-editar', function () {
        const row = $(this).closest('tr');
        const id = tabela.row(row).data().id;

        fetch(`/api/produtos/${id}`).then(res => res.json()).then(p => {
            // Preenche campos normais
            $('#edit-id').val(p.id);
            $('#edit-nome').val(p.nome || '');
            $('#edit-preco').val(p.preco || '');
            $('#edit-categoria').val(p.categoria || '');
            // ... resto dos campos

            // Preenche checkboxes
            $('#edit-isKit').prop('checked', p.isKit).trigger('change');
            // ... resto dos checkboxes

            // Limpa e preenche a configuração do Kit
            const containerKit = $('#edit-listaGruposKit');
            containerKit.empty();
            if (p.isKit && p.gruposKit) {
                p.gruposKit.forEach(grupo => adicionarLinhaGrupoKitEdit(grupo));
            }

            new bootstrap.Modal($('#editModal')[0]).show();
        }).catch(err => Swal.fire('Erro!', 'Não foi possível carregar dados do produto.', 'error'));
    });

    // Mostra/Esconde container do Kit no modal
    $('#edit-isKit').on('change', function() {
        $('#edit-containerKit').toggle(this.checked);
    });

    // Botão para adicionar novo grupo no modal
    $('#edit-btnAddGrupoKit').on('click', () => adicionarLinhaGrupoKitEdit());

    // Submissão do formulário de edição
    $('#formEditProduto').on('submit', function (e) {
        e.preventDefault();

        // --- COLETA DE DADOS DO KIT ---
        const gruposKit = [];
        if ($('#edit-isKit').is(':checked')) {
            $('#edit-listaGruposKit .edit-grupo-kit-bloco').each(function() {
                const nome = $(this).find('.edit-nome-grupo-kit').val();
                const tipo = $(this).find('.edit-tipo-selecao-grupo-kit').val();
                const qtde = parseInt($(this).find('.edit-qtde-max-grupo-kit').val());

                const opcoes = [];
                $(this).find('.edit-opcao-kit-bloco').each(function() {
                    const prodId = $(this).find('.edit-produto-id-opcao-kit').val();
                    if (prodId) {
                        opcoes.push({ produto: { id: parseInt(prodId) } });
                    }
                });

                if (nome && tipo && opcoes.length > 0) {
                    gruposKit.push({ nome: nome, tipoSelecao: tipo, quantidadeMaxima: qtde, opcoes: opcoes });
                }
            });
        }

        const produto = {
            id: $('#edit-id').val(),
            nome: $('#edit-nome').val(),
            preco: parseFloat($('#edit-preco').val()),
            // ... outros campos
            isKit: $('#edit-isKit').is(':checked'),
            gruposKit: gruposKit,
            // ... outros campos booleanos e listas
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

    // Carga inicial
    carregarProdutos();
});