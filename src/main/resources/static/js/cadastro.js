// static/js/cadastro.js
document.addEventListener('DOMContentLoaded', function () {
    const formProduto = document.getElementById('formProduto');
    if (formProduto) {
        formProduto.addEventListener('submit', function (e) {
            e.preventDefault();

            const produto = {
                nome: document.getElementById('nome').value,
                preco: parseFloat(document.getElementById('preco').value),
                qtdeMax: parseInt(document.getElementById('qtdeMax').value),
                categoria: document.getElementById('categoria').value,
                codigoPdv: document.getElementById('codigoPdv').value, // No HTML original era 'codigoPdv'
                descricao: document.getElementById('descricao').value,
                ordemVisualizacao: parseInt(document.getElementById('ordemVisualizacao').value) || 0, // Garante um número
                imagem: document.getElementById('imagem').value
            };

            // Validação básica
            if (!produto.nome || !produto.preco || !produto.qtdeMax) {
                Swal.fire('Atenção!', 'Nome, Preço e Quantidade Máxima são obrigatórios.', 'warning');
                return;
            }
            if (isNaN(produto.preco) || isNaN(produto.qtdeMax)) {
                 Swal.fire('Atenção!', 'Preço e Quantidade Máxima devem ser números.', 'warning');
                return;
            }


            fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            })
            .then(res => {
                if (!res.ok) { // Se o status não for 2xx
                    return res.json().then(err => { throw new Error(err.message || 'Erro desconhecido do servidor') });
                }
                return res.json();
            })
            .then(data => {
                if (data.id) { // Supondo que o backend retorna o objeto salvo com ID
                    Swal.fire('Sucesso!', 'Produto cadastrado com sucesso!', 'success');
                    formProduto.reset();
                } else {
                    // Este else pode não ser alcançado se o erro for tratado no .then(res => ...)
                    Swal.fire('Erro!', 'Erro ao cadastrar produto. Resposta inesperada.', 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao cadastrar produto:', error);
                Swal.fire('Erro!', `Erro ao cadastrar produto: ${error.message}`, 'error');
            });
        });
    }
});