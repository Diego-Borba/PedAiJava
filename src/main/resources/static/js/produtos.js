document.addEventListener('DOMContentLoaded', function () {
    let tabela; 
    function carregarProdutos() {
        fetch('/api/produtos')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const tbody = document.getElementById('produtos');
                if (!tbody) {
                    console.error("Elemento tbody com ID 'produtos' não encontrado.");
                    return;
                }
                tbody.innerHTML = '';
                data.sort((a, b) => {
                    const ordemA = a.ordemVisualizacao !== null ? a.ordemVisualizacao : Infinity;
                    const ordemB = b.ordemVisualizacao !== null ? b.ordemVisualizacao : Infinity;
                    if (ordemA === ordemB) {
                        return a.nome.localeCompare(b.nome);
                    }
                    return ordemA - ordemB;
                });

                data.forEach(p => {
                    const codigoPdvDisplay = p.codigoPdv !== null && p.codigoPdv !== undefined ? p.codigoPdv : 'N/A';
                    tbody.innerHTML += `
                    <tr data-id="${p.id}">
                        <td>${p.nome}</td>
                        <td>R$ ${p.preco ? p.preco.toFixed(2) : '0.00'}</td>
                        <td>${p.categoria || 'N/A'}</td>
                        <td>${p.qtdeMax || 'N/A'}</td>
                        <td>${codigoPdvDisplay}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-editar" title="Editar"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-danger btn-excluir" title="Excluir"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>`;
                });

                // Destrói a DataTable existente antes de reinicializar (se aplicável)
                if ($.fn.DataTable.isDataTable('#tabela-produtos')) {
                    $('#tabela-produtos').DataTable().clear().destroy();
                }
                // Inicializa a DataTable
                tabela = $('#tabela-produtos').DataTable({
                    language: {
                        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json', // Tradução opcional
                    },
                    responsive: true
                });
            })
            .catch(error => {
                console.error("Erro ao carregar produtos:", error);
                Swal.fire('Erro!', 'Não foi possível carregar os produtos.', 'error');
            });
    }

    // Delegação de evento para botões de editar
    document.getElementById('produtos').addEventListener('click', function (e) {
        if (e.target.closest('.btn-editar')) {
            const row = e.target.closest('tr');
            const id = row.getAttribute('data-id');

            fetch(`/api/produtos/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Produto não encontrado ou erro na API');
                    return res.json();
                })
                .then(p => {
                    document.getElementById('edit-id').value = p.id;
                    document.getElementById('edit-nome').value = p.nome || '';
                    document.getElementById('edit-preco').value = p.preco || '';
                    document.getElementById('edit-categoria').value = p.categoria || '';
                    document.getElementById('edit-qtdeMax').value = p.qtdeMax || '';
                    document.getElementById('edit-codigoPdv').value = p.codigoPdv || ''; // Corrigido
                    document.getElementById('edit-descricao').value = p.descricao || '';
                    document.getElementById('edit-imagem').value = p.imagem || '';
                    document.getElementById('edit-ordemVisualizacao').value = p.ordemVisualizacao || '';


                    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
                    editModal.show();
                })
                .catch(err => {
                    console.error("Erro ao buscar produto para edição:", err);
                    Swal.fire('Erro!', 'Não foi possível carregar dados do produto para edição.', 'error');
                });
        } else if (e.target.closest('.btn-excluir')) {
            const row = e.target.closest('tr');
            const id = row.getAttribute('data-id');
            const nomeProduto = row.cells[0].textContent; // Pega o nome do produto da tabela

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
                    fetch(`/api/produtos/${id}`, {
                        method: 'DELETE'
                    })
                    .then(res => {
                        if (res.ok) {
                            Swal.fire('Excluído!', 'Produto excluído com sucesso.', 'success');
                            carregarProdutos(); // Recarrega a lista
                        } else {
                            throw new Error('Falha ao excluir o produto.');
                        }
                    })
                    .catch(err => {
                        console.error("Erro ao excluir produto:", err);
                        Swal.fire('Erro!', 'Não foi possível excluir o produto.', 'error');
                    });
                }
            });
        }
    });

    // Evento de submit do formulário de edição
    const formEditProduto = document.getElementById('formEditProduto');
    if (formEditProduto) {
        formEditProduto.addEventListener('submit', function (e) {
            e.preventDefault();
            const produto = {
                id: document.getElementById('edit-id').value,
                nome: document.getElementById('edit-nome').value,
                preco: parseFloat(document.getElementById('edit-preco').value),
                categoria: document.getElementById('edit-categoria').value,
                qtdeMax: parseInt(document.getElementById('edit-qtdeMax').value),
                codigoPdv: document.getElementById('edit-codigoPdv').value, // Corrigido
                descricao: document.getElementById('edit-descricao').value,
                imagem: document.getElementById('edit-imagem').value,
                ordemVisualizacao: parseInt(document.getElementById('edit-ordemVisualizacao').value)
            };

            fetch(`/api/produtos/${produto.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            }).then(res => {
                if (res.ok) {
                    Swal.fire('Sucesso!', 'Produto atualizado com sucesso!', 'success');
                    carregarProdutos(); // Recarrega a lista
                    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                    if (editModal) editModal.hide();
                } else {
                    res.json().then(data => { // Tenta pegar mais detalhes do erro
                        Swal.fire('Erro!', `Não foi possível atualizar o produto. ${data.message || ''}`, 'error');
                    }).catch(() => {
                        Swal.fire('Erro!', 'Não foi possível atualizar o produto.', 'error');
                    });
                }
            }).catch(err => {
                console.error("Erro ao atualizar produto:", err);
                Swal.fire('Erro!', 'Ocorreu um problema na comunicação para atualizar o produto.', 'error');
            });
        });
    }

    // Carrega os produtos inicialmente
    carregarProdutos();
});