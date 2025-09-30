// src/main/resources/static/js/entrada.js
document.addEventListener("DOMContentLoaded", function () {

    $('#fornecedorId').select2({
        theme: 'bootstrap-5',
        placeholder: 'Selecione um fornecedor'
    });

    carregarFornecedores();
    adicionarItem();

    document.getElementById('btnAdicionarItem').addEventListener('click', adicionarItem);

    document.getElementById('entradaForm').addEventListener('submit', registrarEntrada);

    document.getElementById('itensContainer').addEventListener('input', function (e) {
        if (e.target.matches('.item-quantidade, .item-preco-unitario, .item-fator-entrada')) {
            calcularTotalItens();
        }
    });

    document.getElementById('btnGerarParcelas').addEventListener('click', gerarParcelasManualmente);
});

async function carregarFornecedores() {
    try {
        const response = await fetchWithAuth("/api/fornecedores");
        if (!response.ok) throw new Error("Erro ao buscar fornecedores.");
        const fornecedores = await response.json();

        const select = document.getElementById("fornecedorId");
        select.innerHTML = '<option value=""></option>';

        fornecedores.forEach(f => {
            const option = new Option(f.nome, f.id);
            select.appendChild(option);
        });

        $(select).trigger('change');
    } catch (error) {
        Swal.fire('Erro!', 'Não foi possível carregar os fornecedores.', 'error');
    }
}

function adicionarItem() {
    const container = document.getElementById("itensContainer");
    const div = document.createElement('div');
    div.className = 'row gx-2 mb-3 align-items-center item-bloco border-bottom pb-3';
    div.innerHTML = `
        <div class="col-md-5">
            <label class="form-label small">Produto</label>
            <select class="form-select form-select-sm produto-select" required></select>
            <input type="hidden" class="produto-id">
        </div>
        <div class="col-md-2">
            <label class="form-label small">Quantidade (Ex: Caixas)</label>
            <input type="number" step="0.001" class="form-control form-control-sm item-quantidade" placeholder="Qtde" required>
        </div>
        <div class="col-md-2">
            <label class="form-label small">Fator Entrada (Unid.)</label>
            <input type="number" step="0.01" class="form-control form-control-sm item-fator-entrada" placeholder="Fator" value="1" required>
        </div>
        <div class="col-md-2">
            <label class="form-label small">Preço por Unidade</label>
            <input type="number" step="0.01" class="form-control form-control-sm item-preco-unitario" placeholder="Preço" required>
        </div>
        <div class="col-md-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger btn-sm w-100 btn-remover-item">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(div);

    div.querySelector('.btn-remover-item').addEventListener('click', function () {
        removerItem(this);
    });

    const novoSelect = div.querySelector('.produto-select');
    $(novoSelect).select2({
        theme: 'bootstrap-5',
        placeholder: 'Digite o nome ou código PDV',
        minimumInputLength: 2,
        ajax: {
            url: '/api/produtos/search',
            dataType: 'json',
            delay: 250,
            data: (params) => ({ q: params.term }),
            processResults: (data) => ({ results: data }),
            cache: true,
             transport: async function (params, success, failure) {
                try {
                    const response = await fetchWithAuth(params.url + '?q=' + (params.data.q || ''));
                    if (!response.ok) {
                        failure();
                        return;
                    }
                    const data = await response.json();
                    success({ results: data });
                } catch (error) {
                    failure();
                }
            }
        }
    }).on('select2:select', function (e) {
        const data = e.params.data;
        const bloco = this.closest('.item-bloco');
        bloco.querySelector('.produto-id').value = data.id;
    });
}

function removerItem(button) {
    button.closest('.item-bloco').remove();
    calcularTotalItens();
    if (document.getElementById("itensContainer").children.length === 0) {
        adicionarItem();
    }
}

function calcularTotalItens() {
    let totalMonetario = 0;
    document.querySelectorAll('.item-bloco').forEach(bloco => {
        const qtde = parseFloat(bloco.querySelector('.item-quantidade').value) || 0;
        const fator = parseFloat(bloco.querySelector('.item-fator-entrada').value) || 1;
        const precoUnitario = parseFloat(bloco.querySelector('.item-preco-unitario').value) || 0;
        totalMonetario += (qtde * fator) * precoUnitario;
    });
    document.getElementById('totalItens').textContent = `R$ ${totalMonetario.toFixed(2).replace('.', ',')}`;
    document.getElementById('valorTotalDocumento').value = totalMonetario.toFixed(2);
}


function gerarParcelasManualmente() {
    Swal.fire({
        title: 'Gerar Parcelas',
        html: `
            <div class="form-group">
                <label for="swal-num-parcelas" class="form-label">Número de parcelas</label>
                <input type="number" id="swal-num-parcelas" class="form-control" placeholder="Ex: 3">
            </div>
            <div class="form-group">
                <label for="swal-dias-intervalo" class="form-label">Dias entre parcelas</label>
                <input type="number" id="swal-dias-intervalo" class="form-control" placeholder="Ex: 30">
            </div>
        `,
        confirmButtonText: 'Gerar',
        focusConfirm: false,
        preConfirm: () => ({
            numParcelas: document.getElementById('swal-num-parcelas').value,
            diasIntervalo: document.getElementById('swal-dias-intervalo').value
        })
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const { numParcelas, diasIntervalo } = result.value;
            const total = parseFloat(document.getElementById('valorTotalDocumento').value);
            if (!numParcelas || numParcelas <= 0 || !diasIntervalo || diasIntervalo < 0 || !total || total <= 0) {
                Swal.fire('Atenção!', 'Preencha o valor total do documento, o número de parcelas e o intervalo de dias para continuar.', 'warning');
                return;
            }
            const valorParcela = (total / numParcelas);
            const container = document.getElementById('parcelasContainer');
            container.innerHTML = '';
            let dataVencimento = new Date();
            for (let i = 1; i <= numParcelas; i++) {
                if (i > 1) {
                    dataVencimento.setDate(dataVencimento.getDate() + parseInt(diasIntervalo));
                }
                const div = document.createElement('div');
                div.className = 'row gx-2 mb-2 align-items-center parcela-bloco';
                const valorFinalParcela = (i === parseInt(numParcelas))
                    ? (total - (valorParcela.toFixed(2) * (numParcelas - 1))).toFixed(2)
                    : valorParcela.toFixed(2);
                div.innerHTML = `
                    <div class="col-auto"><strong>${i}ª Parcela:</strong></div>
                    <div class="col-md-4"><input type="number" step="0.01" class="form-control form-control-sm parcela-valor" value="${valorFinalParcela}" required></div>
                    <div class="col-md-4"><input type="date" class="form-control form-control-sm parcela-vencimento" value="${dataVencimento.toISOString().split('T')[0]}" required></div>`;
                container.appendChild(div);
            }
        }
    });
}

async function registrarEntrada(event) {
    event.preventDefault();

    const payload = {
        fornecedorId: document.getElementById('fornecedorId').value,
        tipoDocumento: document.getElementById('tipoDocumento').value,
        valorTotalDocumento: document.getElementById('valorTotalDocumento').value,
        formaPagamento: document.getElementById('formaPagamento').value,
        itens: [],
        parcelas: []
    };

    let formValido = true;

    if (!payload.fornecedorId || !payload.tipoDocumento || !payload.valorTotalDocumento || !payload.formaPagamento) {
        Swal.fire('Atenção!', 'Preencha todos os dados do cabeçalho do documento e do financeiro.', 'warning');
        return;
    }

    document.querySelectorAll('.item-bloco').forEach(bloco => {
        const item = {
            produtoId: bloco.querySelector('.produto-id').value,
            quantidade: bloco.querySelector('.item-quantidade').value,
            precoUnitario: bloco.querySelector('.item-preco-unitario').value,
            fatorEntrada: bloco.querySelector('.item-fator-entrada').value,
        };
        if (!item.produtoId || !item.quantidade || !item.precoUnitario || !item.fatorEntrada) {
            formValido = false;
        }
        payload.itens.push(item);
    });

    if (!formValido || payload.itens.length === 0) {
        Swal.fire('Atenção!', 'Adicione e preencha todos os campos de todos os itens.', 'warning');
        return;
    }

    document.querySelectorAll('.parcela-bloco').forEach(bloco => {
        const parcela = {
            valor: bloco.querySelector('.parcela-valor').value,
            dataVencimento: bloco.querySelector('.parcela-vencimento').value
        };
        if (!parcela.valor || !parcela.dataVencimento) {
            formValido = false;
        }
        payload.parcelas.push(parcela);
    });

    if (!formValido && payload.parcelas.length > 0) {
        Swal.fire('Atenção!', 'Preencha todos os campos das parcelas financeiras.', 'warning');
        return;
    }


    try {
        const response = await fetchWithAuth('/api/entradas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const msg = await response.text();
        if (response.ok) {
            Swal.fire('Sucesso!', msg, 'success').then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(msg || "Ocorreu um erro no servidor.");
        }
    } catch (error) {
        Swal.fire('Erro!', `Falha ao registrar entrada: ${error.message}`, 'error');
    }
}