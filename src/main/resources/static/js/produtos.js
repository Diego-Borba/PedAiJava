document.addEventListener('DOMContentLoaded', function () {
    let tabela;
    let todosOsProdutosParaSelecao = []; // Cache de produtos para dropdown de complementos

    // Função para adicionar linha de configuração de complemento no modal de edição
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
                <select class="form-select form-select-sm edit-complemento-id-select" required>
                    ${selectOptions}
                </select>
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control form-control-sm edit-complemento-qtde-max-input" placeholder="Qtde Máx." value="${config.maxQtdePermitida || 1}" min="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-danger w-100 btn-remover-edit-comp-config"><i class="bi bi-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
        div.querySelector('.btn-remover-edit-comp-config').addEventListener('click', function() {
            this.closest('.edit-comp-config-row').remove();
        });
    }


    function carregarProdutos() {
        fetch('/api/produtos')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                todosOsProdutosParaSelecao = data; 
                const tbody = document.getElementById('produtos');
                if (!tbody) {
                    console.error("Elemento tbody com ID 'produtos' não encontrado.");
                    return;
                }
                tbody.innerHTML = '';
                
                data.sort((a, b) => {
                    if (a.permiteComplementos !== b.permiteComplementos) {
                        return b.permiteComplementos - a.permiteComplementos;
                    }
                    if (a.isComplemento !== b.isComplemento) {
                        return a.isComplemento - b.isComplemento;
                    }
                    const ordemA = a.ordemVisualizacao !== null ? a.ordemVisualizacao : Infinity;
                    const ordemB = b.ordemVisualizacao !== null ? b.ordemVisualizacao : Infinity;
                    if (ordemA === ordemB) {
                        return (a.nome || '').localeCompare(b.nome || '');
                    }
                    return ordemA - ordemB;
                });

                data.forEach(p => {
                    const codigoPdvDisplay = p.codPdv !== null && p.codPdv !== undefined ? p.codPdv : 'N/A';
                    let tipoProduto = '';
                    if (p.permiteComplementos) tipoProduto = '<span class="badge bg-primary">Principal</span>';
                    if (p.isComplemento) tipoProduto += (tipoProduto ? ' ' : '') + '<span class="badge bg-info text-dark">Complemento</span>';
                    if (!tipoProduto) tipoProduto = '<span class="badge bg-secondary">Padrão</span>';


                    tbody.innerHTML += `
                    <tr data-id="${p.id}">
                        <td>${p.nome || 'N/A'} ${tipoProduto}</td>
                        <td>R$ ${p.preco ? p.preco.toFixed(2) : '0.00'}</td>
                        <td>${p.categoria || 'N/A'}</td>
                        <td>${p.qtdeMax || 'N/A'}</td>
                        <td>CódPdv: ${codigoPdvDisplay} / Ordem: ${p.ordemVisualizacao !== null ? p.ordemVisualizacao : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-editar" title="Editar"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-danger btn-excluir" title="Excluir"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>`;
                });

                if ($.fn.DataTable.isDataTable('#tabela-produtos')) {
                    $('#tabela-produtos').DataTable().clear().destroy();
                }
                tabela = $('#tabela-produtos').DataTable({
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
                    responsive: true,
                    order: []
                });
            })
            .catch(error => {
                console.error("Erro ao carregar produtos:", error);
                Swal.fire('Erro!', 'Não foi possível carregar os produtos.', 'error');
            });
    }

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
                    document.getElementById('edit-codigoPdv').value = p.codPdv || '';
                    document.getElementById('edit-descricao').value = p.descricao || '';
                    document.getElementById('edit-imagem').value = p.imagem || '';
                    document.getElementById('edit-ordemVisualizacao').value = p.ordemVisualizacao || '';
                    
                    // --- AQUI ESTÁ A CHECAGEM E ATUALIZAÇÃO DO CAMPO ---
                    // Pega o valor booleano 'p.isComplemento' que vem do banco (true/false)
                    // e define o estado do checkbox de acordo.
                    document.getElementById('edit-isComplemento').checked = p.isComplemento;
                    
                    // Fazemos o mesmo para o outro checkbox para garantir consistência
                    document.getElementById('edit-permiteComplementos').checked = p.permiteComplementos;
                    // --- FIM DA CHECAGEM ---

                    // Dispara o evento 'change' para que a UI que depende dele seja atualizada
                    const permiteComplementosCheckboxEdit = document.getElementById('edit-permiteComplementos');
                    permiteComplementosCheckboxEdit.dispatchEvent(new Event('change'));
                    
                    const listaEditComplementos = document.getElementById('edit-listaComplementosConfig');
                    listaEditComplementos.innerHTML = ''; 

                    if (p.permiteComplementos && p.complementosDisponiveis && p.complementosDisponiveis.length > 0) {
                        p.complementosDisponiveis.forEach(config => adicionarLinhaComplementoConfigEdit(config));
                    }

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
            const nomeProduto = row.cells[0].textContent.split('<span')[0].trim(); 

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
                        if (res.ok) {
                            Swal.fire('Excluído!', 'Produto excluído com sucesso.', 'success');
                            carregarProdutos();
                        } else { throw new Error('Falha ao excluir o produto.'); }
                    })
                    .catch(err => {
                        console.error("Erro ao excluir produto:", err);
                        Swal.fire('Erro!', 'Não foi possível excluir o produto.', 'error');
                    });
                }
            });
        }
    });
    
    const permiteComplementosCheckboxEdit = document.getElementById('edit-permiteComplementos');
    const containerEditComplementos = document.getElementById('edit-containerComplementosDisponiveis');
    if (permiteComplementosCheckboxEdit && containerEditComplementos) {
        permiteComplementosCheckboxEdit.addEventListener('change', function() {
            containerEditComplementos.style.display = this.checked ? 'block' : 'none';
            const listaEditComplementos = document.getElementById('edit-listaComplementosConfig');
            if (this.checked && listaEditComplementos.children.length === 0) {
                 adicionarLinhaComplementoConfigEdit();
            }
        });
    }

    const btnAddEditComplementoConfig = document.getElementById('edit-btnAddComplementoConfig');
    if (btnAddEditComplementoConfig) {
        btnAddEditComplementoConfig.addEventListener('click', () => adicionarLinhaComplementoConfigEdit());
    }


    const formEditProduto = document.getElementById('formEditProduto');
    if (formEditProduto) {
        formEditProduto.addEventListener('submit', function (e) {
            e.preventDefault();

            const isComplementoCheck = document.getElementById('edit-isComplemento').checked;
            const permiteComplementosCheck = document.getElementById('edit-permiteComplementos').checked;

            if (isComplementoCheck && permiteComplementosCheck) {
                Swal.fire('Atenção!', 'Um produto não pode ser um "complemento" e ao mesmo tempo "permitir complementos". Escolha apenas uma opção.', 'warning');
                return;
            }

            const complementosDisponiveisEdit = [];
            if (document.getElementById('edit-permiteComplementos').checked) {
                document.querySelectorAll('#edit-listaComplementosConfig .edit-comp-config-row').forEach(row => {
                    const idSelect = row.querySelector('.edit-complemento-id-select');
                    const qtdeInput = row.querySelector('.edit-complemento-qtde-max-input');
                    if (idSelect && qtdeInput && idSelect.value && qtdeInput.value) {
                        complementosDisponiveisEdit.push({
                            complementoProdutoId: parseInt(idSelect.value),
                            maxQtdePermitida: parseInt(qtdeInput.value)
                        });
                    }
                });
            }
            
            const produto = {
                id: document.getElementById('edit-id').value,
                nome: document.getElementById('edit-nome').value,
                preco: parseFloat(document.getElementById('edit-preco').value),
                categoria: document.getElementById('edit-categoria').value,
                qtdeMax: parseInt(document.getElementById('edit-qtdeMax').value),
                codPdv: document.getElementById('edit-codigoPdv').value ? parseInt(document.getElementById('edit-codigoPdv').value) : null,
                descricao: document.getElementById('edit-descricao').value,
                imagem: document.getElementById('edit-imagem').value,
                ordemVisualizacao: document.getElementById('edit-ordemVisualizacao').value ? parseInt(document.getElementById('edit-ordemVisualizacao').value) : null,
                isComplemento: document.getElementById('edit-isComplemento').checked,
                permiteComplementos: document.getElementById('edit-permiteComplementos').checked,
                complementosDisponiveis: complementosDisponiveisEdit,
                ativo: true
            };

            fetch(`/api/produtos/${produto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            }).then(res => {
                if (res.ok) {
                    Swal.fire('Sucesso!', 'Produto atualizado com sucesso!', 'success');
                    carregarProdutos();
                    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                    if (editModal) editModal.hide();
                } else {
                    res.json().then(data => {
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
    carregarProdutos();
});