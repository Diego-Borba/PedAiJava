// src/main/resources/static/js/admin-pedidos.js
const statusList = ['Recebido', 'Pendente', 'Em Preparo', 'Saiu para Entrega'];
const KDS_UPDATE_INTERVAL = 30000;

function calcularTempoDecorrido(dataPedido) {
    const agora = new Date();
    const pedidoDate = new Date(dataPedido);
    const diffMs = agora - pedidoDate;
    const diffMins = Math.round(diffMs / 60000);

    let status = { text: `${diffMins} min`, className: 'normal' };
    if (diffMins > 15) {
        status.className = 'danger';
    } else if (diffMins > 7) {
        status.className = 'warning';
    }
    return status;
}

async function carregarPedidos() {
    try {
        const res = await fetchWithAuth('/api/pedidos');
        if (!res.ok) throw new Error("Falha ao carregar pedidos.");
        
        const pedidos = await res.json();
        const board = document.getElementById('kdsBoard');
        if (!board) return;
        board.innerHTML = '';

        statusList.forEach(status => {
            const col = document.createElement('div');
            col.className = 'col-md-3 mb-3';
            col.innerHTML = `
                <div class="column h-100" id="coluna-${status.replace(/\s+/g, '-')}"
                    ondragover="permitirSoltar(event)"
                    ondragleave="removerHover(event)"
                    ondrop="soltar(event, '${status}')">
                    <h4 class="sticky-top">${status} (<span id="contador-${status.replace(/\s+/g, '-')}">0</span>)</h4>
                    <div class="cards-container"></div>
                </div>`;
            board.appendChild(col);
        });

        const contadores = {};
        statusList.forEach(status => contadores[status] = 0);
        const pedidosFiltrados = pedidos
            .filter(p => p.status && statusList.includes(p.status))
            .sort((a, b) => new Date(a.dataPedido) - new Date(b.dataPedido));


        pedidosFiltrados.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card mb-3 shadow-sm';
            card.setAttribute('draggable', true);
            card.setAttribute('id', 'pedido-' + p.id);
            card.ondragstart = arrastar;

            const itensHtml = p.itens.map(i => `
                <li class="list-group-item">
                    <strong>${i.quantidade}x</strong> ${i.produto || 'Produto desconhecido'}
                </li>`).join('');

            const dataFormatada = p.dataPedido ? new Date(p.dataPedido).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit'
            }) : 'Data indisponível';
            
            const tempoStatus = calcularTempoDecorrido(p.dataPedido);
            card.style.borderLeftColor = tempoStatus.className === 'danger' ? '#dc3545' : (tempoStatus.className === 'warning' ? '#ffc107' : '#0d6efd');

            card.innerHTML = `
                <div class="card-header">
                    <span><strong>#${p.id}</strong> - ${dataFormatada}</span>
                    <span class="time-indicator ${tempoStatus.className}">${tempoStatus.text}</span>
                </div>
                <ul class="list-group list-group-flush">${itensHtml}</ul>
                <div class="card-footer text-end">
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirPedido(${p.id})"><i class="bi bi-printer"></i> Imprimir</button>
                    ${p.status === 'Saiu para Entrega' ? `<button class="btn btn-sm btn-success ms-2" onclick="concluirPedido(${p.id})"><i class="bi bi-check-circle"></i> Concluir</button>` : ''}
                </div>`;

            const colunaId = `coluna-${p.status.replace(/\s+/g, '-')}`;
            const colunaContent = document.getElementById(colunaId)?.querySelector('.cards-container');
            if (colunaContent) {
                colunaContent.appendChild(card);
                contadores[p.status]++;
            }
        });

        statusList.forEach(status => {
            const contadorElem = document.getElementById(`contador-${status.replace(/\s+/g, '-')}`);
            if (contadorElem) {
                contadorElem.textContent = contadores[status];
            }
        });

    } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
    }
}

function arrastar(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
}

function permitirSoltar(ev) {
    ev.preventDefault();
    const targetColumn = ev.currentTarget.closest('.column');
    if (targetColumn) {
      targetColumn.classList.add('drag-over');
    }
}

function removerHover(ev) {
    const targetColumn = ev.currentTarget.closest('.column');
    if (targetColumn) {
        targetColumn.classList.remove('drag-over');
    }
}

function soltar(ev, novoStatus) {
    ev.preventDefault();
    const targetColumn = ev.currentTarget.closest('.column');
    if (targetColumn) {
        targetColumn.classList.remove('drag-over');
    }

    const idElemento = ev.dataTransfer.getData("text");
    const card = document.getElementById(idElemento);
    if (card) {
        card.classList.remove('dragging');
        const cardsContainer = targetColumn.querySelector('.cards-container');
        if(cardsContainer) cardsContainer.appendChild(card);

        const idPedido = parseInt(idElemento.replace('pedido-', ''));
        atualizarStatus(idPedido, novoStatus);
    }
}

async function atualizarStatus(id, novoStatus) {
    try {
        await fetchWithAuth(`/api/pedidos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus })
        });
        carregarPedidos();
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status.');
        carregarPedidos();
    }
}

function formatarPedidoParaImpressao(pedido) {
    let texto = `Pedido #${pedido.id}\n`;
    texto += `Data: ${new Date(pedido.dataPedido).toLocaleString('pt-BR')}\n`;
    texto += `\n--------------------------\n\n`;
    texto += `Itens:\n`;
    let totalPedido = 0;

    pedido.itens.forEach(item => {
        const nomeProduto = item.produto || 'Produto desconhecido';
        const totalItem = item.quantidade * item.precoUnitario;
        totalPedido += totalItem;
        texto += `${item.quantidade}x ${nomeProduto.padEnd(30, ' ')} R$ ${totalItem.toFixed(2)}\n`;
    });
    texto += `\n--------------------------\n`;
    texto += `\nTotal do Pedido: R$ ${totalPedido.toFixed(2)}\n`;
    texto += `\n--------------------------\n`;
    return texto;
}

async function imprimirPedido(idPedido) {
    try {
        const res = await fetchWithAuth(`/api/pedidos/${idPedido}`);
        if (!res.ok) throw new Error("Falha ao buscar dados do pedido.");
        
        const pedido = await res.json();
        const textoImpressao = formatarPedidoParaImpressao(pedido);
        const janelaImpressao = window.open('', '_blank', 'width=400,height=600');
        if (janelaImpressao) {
            janelaImpressao.document.write(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <title>Impressão do Pedido ${pedido.id}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; margin: 5px; padding:0; }
                        pre { margin: 0; padding:0; white-space: pre-wrap; word-wrap: break-word; }
                    </style>
                </head>
                <body>
                    <pre>${textoImpressao}</pre>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `);
            janelaImpressao.document.close();
        } else {
            alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
        }
    } catch (err) {
        console.error('Erro ao carregar dados para impressão:', err);
        alert('Erro ao carregar dados do pedido para impressão.');
    }
}

async function concluirPedido(idPedido) {
    try {
        await fetchWithAuth(`/api/pedidos/${idPedido}/status`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novoStatus: 'Entregue' })
        });
        carregarPedidos();
    } catch (err) {
        console.error('Erro ao concluir o pedido:', err);
        alert('Erro ao concluir o pedido.');
    }
}

window.onload = () => {
    carregarPedidos();
    setInterval(carregarPedidos, KDS_UPDATE_INTERVAL);
};

document.addEventListener('dragend', (event) => {
    if (event.target.classList.contains('dragging')) {
        event.target.classList.remove('dragging');
    }
}, false);