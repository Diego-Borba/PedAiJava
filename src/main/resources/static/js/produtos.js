// src/main/resources/static/js/produtos.js
document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];
    let novaImagemParaUpload = null;

    async function carregarProdutos() {
        try {
            const response = await fetchWithAuth('/api/produtos');
            if (!response.ok) throw new Error('Falha ao carregar produtos do servidor.');
            todosOsProdutosParaSelecao = await response.json();
            renderizarDataTable(todosOsProdutosParaSelecao);
        } catch (err) {
            Swal.fire('Erro!', `Não foi possível carregar os produtos: ${err.message}`, 'error');
        }
    }

    function renderizarDataTable(data) {
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
                            let badgeColor = 'bg-primary';
                            if (row.tipo === 'Kit') badgeColor = 'bg-info text-dark';
                            if (row.tipo === 'Matéria-Prima') badgeColor = 'bg-success';
                            if (row.tipo === 'Complemento') badgeColor = 'bg-secondary';
                            if (row.tipo === 'Composto') badgeColor = 'bg-warning text-dark';

                            const tipoBadge = `<span class="badge ${badgeColor}">${row.tipo}</span>`;
                            return `${row.nome || 'N/A'} <br> ${tipoBadge}`;
                        }
                    },
                    { data: "preco", title: "Preço", render: (d) => `R$ ${d != null ? d.toFixed(2).replace('.', ',') : '0,00'}` },
                    {
                        data: "estoqueAtual", title: "Estoque", render: function (d) {
                            if (d == null) return `<span class="badge bg-secondary">N/A</span>`;
                            const estoque = parseFloat(d);
                            const cor = estoque > 10 ? 'bg-success' : (estoque > 0 ? 'bg-warning text-dark' : 'bg-danger');
                            return `<span class="badge ${cor}" style="font-size: 0.9em;">${estoque.toFixed(3).replace('.', ',')}</span>`;
                        }
                    },
                    { data: "categoria", title: "Categoria", defaultContent: "Sem categoria" },
                    { data: "codPdv", title: "Cód. PDV", render: (d) => d || 'N/A' },
                    {
                        data: "id", title: "Ações",
                        render: (data) => `<button class="btn btn-sm btn-warning btn-editar" data-id="${data}" title="Editar"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-danger btn-excluir" data-id="${data}" title="Excluir"><i class="bi bi-trash"></i></button>`,
                        orderable: false
                    }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                order: [[0, 'asc']]
            });
        }
    }

    $('#tabela-produtos tbody').on('click', '.btn-editar', function () {
        const id = $(this).data('id');
        abrirModalDeEdicao(id);
    });

    async function abrirModalDeEdicao(id) {
        try {
            const res = await fetchWithAuth(`/api/produtos/${id}`);
            if (!res.ok) throw new Error('Produto não encontrado para edição.');
            const p = await res.json();

            $('#formEditProduto')[0].reset();
            novaImagemParaUpload = null;
            $('#edit-imagemFile').val('');
            $('#edit-listaGruposKit').empty();
            $('#edit-listaReceita').empty();

            $('#edit-id').val(p.id);
            $('#edit-nome').val(p.nome || '');
            $('#edit-preco').val(p.preco || 0);
            $('#edit-categoria').val(p.categoria || '');
            $('#edit-qtdeMax').val(p.qtdeMax || 10);
            $('#edit-codigoPdv').val(p.codPdv || '');
            $('#edit-ordemVisualizacao').val(p.ordemVisualizacao || 0);
            $('#edit-descricao').val(p.descricao || '');

            $('#edit-isMateriaPrima').prop('checked', p.isMateriaPrima);
            $('#edit-isComplemento').prop('checked', p.isComplemento);
            $('#edit-permiteComplementos').prop('checked', p.permiteComplementos);
            $('#edit-vendidoIndividualmente').prop('checked', p.vendidoIndividualmente);
            $('#edit-isKit').prop('checked', p.isKit).trigger('change');

            const previewContainer = document.getElementById('edit-preview-container');
            const imagePreview = document.getElementById('edit-image-preview');
            const produtoOriginalNaLista = todosOsProdutosParaSelecao.find(prod => prod.id == id);
            if (produtoOriginalNaLista && produtoOriginalNaLista.imagem) {
                imagePreview.src = `data:${produtoOriginalNaLista.imagemTipo};base64,${produtoOriginalNaLista.imagem}`;
                previewContainer.style.display = 'block';
            } else {
                previewContainer.style.display = 'none';
                imagePreview.src = '#';
            }

            if (p.isKit && p.gruposKit) {
                p.gruposKit.forEach(grupo => adicionarLinhaGrupoKitEdit(grupo));
            }

            if (p.receita && p.receita.length > 0) {
                p.receita.forEach(itemReceita => {
                    adicionarLinhaIngredienteEdit(itemReceita);
                });
            }

            new bootstrap.Modal($('#editModal')[0]).show();

        } catch (err) {
            Swal.fire('Erro!', `Não foi possível carregar dados do produto: ${err.message}`, 'error');
        }
    }

    $('#formEditProduto').on('submit', async function (e) {
        e.preventDefault();
        const id = $('#edit-id').val();

        const gruposKit = [];
        if ($('#edit-isKit').is(':checked')) {
            document.querySelectorAll('#edit-listaGruposKit .grupo-kit-bloco').forEach(blocoGrupo => {
                const nomeGrupo = blocoGrupo.querySelector('.nome-grupo-kit').value;
                const tipoSelecao = blocoGrupo.querySelector('.tipo-selecao-grupo-kit').value;
                const quantidadeMaxima = parseInt(blocoGrupo.querySelector('.qtde-max-grupo-kit').value);
                const opcoes = [];
                blocoGrupo.querySelectorAll('.opcao-kit-bloco').forEach(blocoOpcao => {
                    const produtoId = blocoOpcao.querySelector('.produto-id-opcao-kit').value;
                    if (produtoId) {
                        opcoes.push({ produto: { id: parseInt(produtoId) } });
                    }
                });
                if (nomeGrupo && tipoSelecao && opcoes.length > 0) {
                    gruposKit.push({ nome: nomeGrupo, tipoSelecao, quantidadeMaxima, opcoes });
                }
            });
        }

        const receita = [];
        document.querySelectorAll('#edit-listaReceita .ingrediente-bloco').forEach(bloco => {
            const ingredienteId = bloco.querySelector('.select-ingrediente').value;
            const quantidade = parseFloat(bloco.querySelector('.qtde-ingrediente').value);
            if (ingredienteId && quantidade > 0) {
                receita.push({
                    produtoIngredienteId: parseInt(ingredienteId),
                    quantidadeUtilizada: quantidade
                });
            }
        });

        const produto = {
            id: id,
            nome: $('#edit-nome').val(),
            preco: parseFloat($('#edit-preco').val()),
            categoria: $('#edit-categoria').val(),
            qtdeMax: parseInt($('#edit-qtdeMax').val()),
            codPdv: $('#edit-codigoPdv').val() || null,
            ordemVisualizacao: parseInt($('#edit-ordemVisualizacao').val()) || 0,
            descricao: $('#edit-descricao').val(),
            isMateriaPrima: $('#edit-isMateriaPrima').is(':checked'),
            isComplemento: $('#edit-isComplemento').is(':checked'),
            permiteComplementos: $('#edit-permiteComplementos').is(':checked'),
            isKit: $('#edit-isKit').is(':checked'),
            vendidoIndividualmente: $('#edit-vendidoIndividualmente').is(':checked'),
            gruposKit: gruposKit,
            receita: receita
        };

        try {
            const responseProduto = await fetchWithAuth(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
            if (!responseProduto.ok) throw new Error(await responseProduto.text());

            if (novaImagemParaUpload) {
                const responseImagem = await fetchWithAuth(`/api/produtos/${id}/imagem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imagemBase64: novaImagemParaUpload.base64,
                        imagemTipo: novaImagemParaUpload.tipo
                    })
                });
                if (!responseImagem.ok) throw new Error('Dados salvos, mas falha ao enviar nova imagem.');
            }

            bootstrap.Modal.getInstance($('#editModal')[0]).hide();
            Swal.fire('Sucesso!', 'Produto atualizado!', 'success').then(() => carregarProdutos());

        } catch (err) {
            Swal.fire('Erro!', `Não foi possível atualizar: ${err.message}`, 'error');
        }
    });

    $('#edit-isKit').on('change', function() {
        $('#edit-containerKit').css('display', this.checked ? 'block' : 'none');
    });

    $('#edit-btnAddGrupoKit').on('click', () => adicionarLinhaGrupoKitEdit());

    function adicionarLinhaGrupoKitEdit(grupo = {}) {
        const divGrupo = document.createElement('div');
        divGrupo.className = 'p-3 border rounded mb-3 bg-white shadow-sm grupo-kit-bloco';
        divGrupo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Grupo de Opções</h6>
                <button type="button" class="btn btn-sm btn-outline-danger btn-remover-grupo">Remover Grupo</button>
            </div>
            <div class="row g-3">
                <div class="col-md-12"><label class="form-label small">Nome do Grupo</label><input type="text" class="form-control form-control-sm nome-grupo-kit" value="${grupo.nome || ''}" required></div>
                <div class="col-md-6">
                    <label class="form-label small">Tipo de Seleção</label>
                    <select class="form-select form-select-sm tipo-selecao-grupo-kit" required>
                        <option value="ESCOLHA_UNICA" ${grupo.tipoSelecao === 'ESCOLHA_UNICA' ? 'selected' : ''}>Escolha Única</option>
                        <option value="QUANTIDADE_TOTAL" ${grupo.tipoSelecao === 'QUANTIDADE_TOTAL' ? 'selected' : ''}>Quantidade Total</option>
                    </select>
                </div>
                <div class="col-md-6"><label class="form-label small">Quantidade Máxima</label><input type="number" class="form-control form-control-sm qtde-max-grupo-kit" value="${grupo.quantidadeMaxima || 1}" min="1"></div>
            </div>
            <hr>
            <label class="form-label small fw-bold">Opções para este Grupo:</label>
            <div class="lista-opcoes-kit mb-2"></div>
            <button type="button" class="btn btn-sm btn-outline-success btn-add-opcao-kit"><i class="bi bi-plus"></i> Adicionar Opção</button>
        `;
        $('#edit-listaGruposKit').append(divGrupo);

        const containerOpcoes = divGrupo.querySelector('.lista-opcoes-kit');
        if (grupo.opcoes && grupo.opcoes.length > 0) {
            grupo.opcoes.forEach(opcao => adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao));
        } else {
            adicionarLinhaOpcaoKitEdit(containerOpcoes);
        }
    }

    function adicionarLinhaOpcaoKitEdit(containerOpcoes, opcao = {}) {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'row g-2 mb-2 align-items-center opcao-kit-bloco';

        let optionsHTML = '<option value="">Selecione um produto...</option>';
        todosOsProdutosParaSelecao.forEach(p => {
            const isSelected = opcao.produto && p.id == opcao.produto.id ? 'selected' : '';
            optionsHTML += `<option value="${p.id}" ${isSelected}>${p.nome}</option>`;
        });

        divOpcao.innerHTML = `
            <div class="col-10"><select class="form-select form-select-sm produto-id-opcao-kit" required>${optionsHTML}</select></div>
            <div class="col-2"><button type="button" class="btn btn-sm btn-danger w-100 btn-remover-opcao"><i class="bi bi-trash"></i></button></div>`;

        containerOpcoes.appendChild(divOpcao);
    }

    $('#edit-listaGruposKit').on('click', '.btn-remover-grupo', function() { $(this).closest('.grupo-kit-bloco').remove(); });
    $('#edit-listaGruposKit').on('click', '.btn-add-opcao-kit', function() { adicionarLinhaOpcaoKitEdit(this.previousElementSibling); });
    $('#edit-listaGruposKit').on('click', '.btn-remover-opcao', function() { $(this).closest('.opcao-kit-bloco').remove(); });

    $('#edit-btnAddReceita').on('click', () => adicionarLinhaIngredienteEdit());

    function adicionarLinhaIngredienteEdit(itemReceita = {}) {
        const materiasPrimas = todosOsProdutosParaSelecao.filter(p => p.tipo === 'Matéria-Prima');

        let optionsHTML = '<option value="">Selecione um ingrediente...</option>';
        materiasPrimas.forEach(mp => {
            const isSelected = itemReceita.produtoIngredienteId == mp.id ? 'selected' : '';
            optionsHTML += `<option value="${mp.id}" ${isSelected}>${mp.nome}</option>`;
        });

        const div = document.createElement('div');
        div.className = 'row g-3 mb-3 pb-3 border-bottom ingrediente-bloco';
        div.innerHTML = `
            <div class="col-md-7">
                <label class="form-label small">Ingrediente (Matéria-Prima)</label>
                <select class="form-select form-select-sm select-ingrediente" required>${optionsHTML}</select>
            </div>
            <div class="col-md-4">
                <label class="form-label small">Qtde. Utilizada</label>
                <input type="number" step="0.001" class="form-control form-control-sm qtde-ingrediente" required placeholder="Ex: 0.250 para 250g" value="${itemReceita.quantidadeUtilizada || ''}">
            </div>
            <div class="col-md-1 d-flex align-items-end">
                <button type="button" class="btn btn-danger btn-sm w-100 btn-remover-ingrediente"><i class="bi bi-trash"></i></button>
            </div>
        `;
        document.getElementById('edit-listaReceita').appendChild(div);

        div.querySelector('.btn-remover-ingrediente').addEventListener('click', function() {
            this.closest('.ingrediente-bloco').remove();
        });
    }

    $('#tabela-produtos tbody').on('click', '.btn-excluir', function () {
        const id = $(this).data('id');
        const nomeProduto = tabela.row($(this).closest('tr')).data().nome;

        Swal.fire({
            title: `Tem certeza que deseja excluir "${nomeProduto}"?`,
            text: "Esta ação não pode ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetchWithAuth(`/api/produtos/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Erro ao excluir.');
                    Swal.fire('Excluído!', 'O produto foi removido.', 'success');
                    carregarProdutos();
                } catch (err) {
                    Swal.fire('Erro!', `Não foi possível excluir: ${err.message}`, 'error');
                }
            }
        });
    });

    $('#edit-imagemFile').on('change', function(event) {
        const file = event.target.files[0];
        const previewContainer = document.getElementById('edit-preview-container');
        const imagePreview = document.getElementById('edit-image-preview');

        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                novaImagemParaUpload = {
                    base64: e.target.result,
                    tipo: file.type
                };
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            novaImagemParaUpload = null;
            if (file) {
                Swal.fire('Formato Inválido', 'Selecione um JPG ou PNG.', 'warning');
                event.target.value = '';
            }
        }
    });

    carregarProdutos();
});