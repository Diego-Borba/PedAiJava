document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = [];
    // --- NOVA VARIÁVEL ---
    // Armazena a nova imagem selecionada durante a edição
    let novaImagemParaUpload = null; 

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
            }).catch(err => Swal.fire('Erro!', `Não foi possível carregar os produtos: ${err.message}`, 'error'));
    }

    // --- LÓGICA DE EDIÇÃO (EVENT LISTENERS) ---

    $('#tabela-produtos tbody').on('click', '.btn-editar', function () {
        const id = $(this).data('id');
        const rowData = todosOsProdutosParaSelecao.find(p => p.id == id);
        
        // --- NOVA LÓGICA: MOSTRAR IMAGEM ATUAL ---
        const previewContainer = document.getElementById('edit-preview-container');
        const imagePreview = document.getElementById('edit-image-preview');
        
        if (rowData && rowData.imagem && rowData.imagemTipo) {
            imagePreview.src = `data:${rowData.imagemTipo};base64,${rowData.imagem}`;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }

        fetch(`/api/produtos/${id}`).then(res => res.json()).then(p => {
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
            $('#edit-isKit').prop('checked', p.isKit).trigger('change');
            $('#edit-vendidoIndividualmente').prop('checked', p.vendidoIndividualmente);

            const containerKit = $('#edit-listaGruposKit');
            containerKit.empty();
            if (p.isKit && p.gruposKit) {
                p.gruposKit.forEach(grupo => adicionarLinhaGrupoKitEdit(grupo));
            }
            
            novaImagemParaUpload = null; // Limpa a variável de imagem
            document.getElementById('edit-imagemFile').value = ''; // Limpa o campo de ficheiro
            new bootstrap.Modal($('#editModal')[0]).show();
        }).catch(err => Swal.fire('Erro!', 'Não foi possível carregar dados do produto para edição.', 'error'));
    });

    // --- NOVO LISTENER: Para o campo de upload de imagem na edição ---
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

    // --- LÓGICA DE SUBMISSÃO DO FORMULÁRIO DE EDIÇÃO ---
    $('#formEditProduto').on('submit', async function (e) {
        e.preventDefault();
        const id = $('#edit-id').val();

        const produto = {
            id: id,
            nome: $('#edit-nome').val(),
            preco: parseFloat($('#edit-preco').val()),
            // ... (todos os outros campos, exceto imagem)
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
            gruposKit: [] // Adicione a lógica de grupos aqui se necessário
        };

        try {
            // 1. Atualiza os dados do produto (sem a imagem)
            const responseProduto = await fetch(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
            if (!responseProduto.ok) throw new Error(await responseProduto.text());

            // 2. Se uma nova imagem foi selecionada, faz o upload
            if (novaImagemParaUpload) {
                const responseImagem = await fetch(`/api/produtos/${id}/imagem`, {
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
    
    // Funções auxiliares para o modal de edição (grupos/opções de kit)
    function adicionarLinhaGrupoKitEdit(grupo = {}) {
        // ... (código para adicionar grupo no modal de edição)
    }
    function adicionarLinhaOpcaoKitEdit(container, opcao = {}) {
        // ... (código para adicionar opção no modal de edição)
    }

    // --- Deleção de Produto ---
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
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/produtos/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (!res.ok) throw new Error('Erro ao excluir.');
                    Swal.fire('Excluído!', 'O produto foi removido.', 'success');
                    carregarProdutos();
                }).catch(err => Swal.fire('Erro!', `Não foi possível excluir: ${err.message}`, 'error'));
            }
        });
    });

    // Carga inicial
    carregarProdutos();
});