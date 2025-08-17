// src/main/resources/static/js/produtos.js
document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];

    // --- Funções de Manipulação do Modal de Edição ---

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

        const containerOpcoes = divGrupo.querySelector('.edit-lista-opcoes-kit');
        if (grupo.opcoes && grupo.opcoes.length > 0) {
            grupo.opcoes.forEach(opcao => adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao));
        }

        divGrupo.querySelector('.btn-remover-grupo-edit').addEventListener('click', function () { this.closest('.edit-grupo-kit-bloco').remove(); });
        divGrupo.querySelector('.btn-add-opcao-kit-edit').addEventListener('click', function () { adicionarLinhaOpcaoKitEdit(this.previousElementSibling); });
    }

    function adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao = {}) {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'row g-2 mb-2 align-items-center edit-opcao-kit-bloco';

        let optionsHTML = '<option value="">Selecione um produto...</option>';
        todosOsProdutosParaSelecao.forEach(p => {
            const isSelected = opcao.produto && p.id == opcao.produto.id ? 'selected' : '';
            optionsHTML += `<option value="${p.id}" ${isSelected}>${p.nome}</option>`;
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
            .then(res => {
                if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);
                return res.json();
            })
            .then(data => {
                todosOsProdutosParaSelecao = data;
                if ($.fn.DataTable.isDataTable('#tabela-produtos')) {
                    tabela.clear().rows.add(data).draw();
                } else {
                    tabela = $('#tabela-produtos').DataTable({
                        data: data,
                        columns: [
                            {
                                data: null,
                                title: "Nome / Tipo",
                                render: function (data, type, row) {
                                    let badgeColor = 'bg-primary'; // Cor padrão para Venda Direta
                                    if (row.tipo === 'Kit') badgeColor = 'bg-info text-dark';
                                    if (row.tipo === 'Matéria-Prima') badgeColor = 'bg-success';
                                    if (row.tipo === 'Complemento') badgeColor = 'bg-secondary';
                                    if (row.tipo === 'Composto') badgeColor = 'bg-warning text-dark';

                                    const tipoBadge = `<span class="badge ${badgeColor}">${row.tipo}</span>`;
                                    const nomeProduto = row.nome || 'N/A';
                                    return `${nomeProduto} <br> ${tipoBadge}`;
                                }
                            },
                            {
                                data: "preco",
                                title: "Preço",
                                render: function(d) {
                                    return (typeof d === 'number') ? `R$ ${d.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
                                }
                            },
                            {
                                data: "estoqueAtual",
                                title: "Estoque",
                                render: function (d) {
                                    if (d == null) return `<span class="badge bg-secondary">N/A</span>`;
                                    const estoque = parseFloat(d);
                                    const cor = estoque > 10 ? 'bg-success' : (estoque > 0 ? 'bg-warning text-dark' : 'bg-danger');
                                    return `<span class="badge ${cor}" style="font-size: 0.9em;">${estoque.toFixed(3).replace('.', ',')}</span>`;
                                }
                            },
                            {
                                data: "categoria",
                                title: "Categoria",
                                defaultContent: "Sem categoria"
                            },
                            {
                                data: "codPdv",
                                title: "Cód. PDV",
                                render: (d) => d || 'N/A'
                            },
                            {
                                data: "id",
                                title: "Ações",
                                render: function(data) {
                                    return `<button class="btn btn-sm btn-warning btn-editar" data-id="${data}" title="Editar"><i class="bi bi-pencil"></i></button>
                                            <button class="btn btn-sm btn-danger btn-excluir" data-id="${data}" title="Excluir"><i class="bi bi-trash"></i></button>`;
                                },
                                orderable: false
                            }
                        ],
                        language: {
                            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
                        },
                        order: [[0, 'asc']]
                    });
                }
            }).catch(err => Swal.fire('Erro!', `Não foi possível carregar os produtos: ${err.message}`, 'error'));
    }

    // --- Event Listeners ---
    $('#tabela-produtos tbody').on('click', '.btn-editar', function () {
        const id = $(this).data('id');
        fetch(`/api/produtos/${id}`).then(res => res.json()).then(p => {
            $('#edit-id').val(p.id);
            $('#edit-nome').val(p.nome || '');
            $('#edit-preco').val(p.preco || 0);
            $('#edit-categoria').val(p.categoria || '');
            $('#edit-qtdeMax').val(p.qtdeMax || 10);
            $('#edit-codigoPdv').val(p.codPdv || '');
            $('#edit-ordemVisualizacao').val(p.ordemVisualizacao || 0);
            $('#edit-descricao').val(p.descricao || '');
            $('#edit-imagem').val(p.imagem || '');

            $('#edit-isMateriaPrima').prop('checked', p.isMateriaPrima);
            $('#edit-isComplemento').prop('checked', p.isComplemento);
            $('#edit-permiteComplementos').prop('checked', p.permiteComplementos);
            $('#edit-isKit').prop('checked', p.isKit).trigger('change');
            $('#edit-vendidoIndividualmente').prop('checked', p.vendidoIndividualmente);

            const containerKit = $('#edit-listaGruposKit');
            containerKit.empty();
            if (p.isKit && p.gruposKit) {
                p.gruposKit.forEach(grupo => adicionarLinhaGrupoKitEdit(grupo));
            }

            new bootstrap.Modal($('#editModal')[0]).show();
        }).catch(err => Swal.fire('Erro!', 'Não foi possível carregar dados do produto para edição.', 'error'));
    });

    $('#edit-isKit').on('change', function () {
        $('#edit-containerKit').toggle(this.checked);
    });

    $('#edit-btnAddGrupoKit').on('click', () => adicionarLinhaGrupoKitEdit());

    $('#formEditProduto').on('submit', function (e) {
        e.preventDefault();

        const gruposKit = [];
        if ($('#edit-isKit').is(':checked')) {
            $('#edit-listaGruposKit .edit-grupo-kit-bloco').each(function () {
                const nome = $(this).find('.edit-nome-grupo-kit').val();
                const tipo = $(this).find('.edit-tipo-selecao-grupo-kit').val();
                const qtde = parseInt($(this).find('.edit-qtde-max-grupo-kit').val());
                const opcoes = [];
                $(this).find('.edit-opcao-kit-bloco').each(function () {
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
            categoria: $('#edit-categoria').val(),
            qtdeMax: parseInt($('#edit-qtdeMax').val()),
            codPdv: $('#edit-codigoPdv').val() ? $('#edit-codigoPdv').val() : null,
            ordemVisualizacao: $('#edit-ordemVisualizacao').val() ? parseInt($('#edit-ordemVisualizacao').val()) : 0,
            descricao: $('#edit-descricao').val(),
            imagem: $('#edit-imagem').val(),
            isMateriaPrima: $('#edit-isMateriaPrima').is(':checked'),
            isComplemento: $('#edit-isComplemento').is(':checked'),
            permiteComplementos: $('#edit-permiteComplementos').is(':checked'),
            isKit: $('#edit-isKit').is(':checked'),
            vendidoIndividualmente: $('#edit-vendidoIndividualmente').is(':checked'),
            gruposKit: gruposKit,
            receita: [],
            complementosDisponiveis: []
        };

        fetch(`/api/produtos/${produto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        }).then(res => {
            if (!res.ok) {
                return res.text().then(text => { throw new Error(text || 'Erro no servidor') });
            }
            bootstrap.Modal.getInstance($('#editModal')[0]).hide();
            Swal.fire('Sucesso!', 'Produto atualizado!', 'success').then(() => carregarProdutos());
        }).catch(err => {
            Swal.fire('Erro!', `Não foi possível atualizar: ${err.message}`, 'error');
        });
    });

    $('#tabela-produtos tbody').on('click', '.btn-excluir', function () {
        const id = $(this).data('id');
        const row = $(this).closest('tr');
        const nomeProduto = tabela.row(row).data().nome;

        Swal.fire({
            title: `Tem certeza que deseja excluir "${nomeProduto}"?`,
            text: "Esta ação não pode ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/produtos/${id}`, {
                    method: 'DELETE'
                }).then(res => {
                    if (!res.ok) {
                        throw new Error('Erro ao excluir o produto.');
                    }
                    Swal.fire('Excluído!', 'O produto foi removido.', 'success');
                    carregarProdutos();
                }).catch(err => {
                    Swal.fire('Erro!', `Não foi possível excluir o produto. ${err.message}`, 'error');
                });
            }
        });
    });

    carregarProdutos();
});