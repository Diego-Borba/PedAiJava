// static/js/admin-pedidos.js
const statusList = ['Recebido', 'Pendente', 'Em Preparo', 'Saiu para Entrega'];
const KDS_UPDATE_INTERVAL = 30000; // Atualiza a cada 30 segundos

async function carregarPedidos() {
    try {
        const res = await axios.get('/api/pedidos');
        const pedidos = res.data;
        const board = document.getElementById('kdsBoard');
        if (!board) return;
        board.innerHTML = ''; // Limpa o board

        // Cria colunas dinamicamente
        statusList.forEach(status => {
            const col = document.createElement('div');
            col.className = 'col-md-3 mb-3'; // Adiciona margem inferior para responsividade
            col.innerHTML = `
                <div class="column h-100" id="coluna-${status.replace(/\s+/g, '-')}" 
                    ondragover="permitirSoltar(event)" 
                    ondragleave="removerHover(event)"
                    ondrop="soltar(event, '${status}')">
                    <h4 class="sticky-top bg-dark py-2">${status} (<span id="contador-${status.replace(/\s+/g, '-')}">0</span>)</h4>
                    <div class="cards-container"></div>
                </div>`;
            board.appendChild(col);
        });

        const contadores = {};
        statusList.forEach(status => contadores[status] = 0);

        // Filtra e ordena os pedidos: Primeiro os mais antigos
        const pedidosFiltrados = pedidos
            .filter(p => p.status && statusList.includes(p.status)) // Garante que o status é válido e existe
            .sort((a, b) => new Date(a.dataPedido) - new Date(b.dataPedido));


        pedidosFiltrados.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card mb-3 text-white shadow-sm'; // Adicionado shadow
            card.setAttribute('draggable', true);
            card.setAttribute('id', 'pedido-' + p.id);
            card.ondragstart = arrastar;

            const itensHtml = p.itens.map(i => `
                <li class="list-group-item bg-dark text-white border-secondary">
                    ${i.quantidade}x ${i.produto || 'Produto desconhecido'} 
                    ${i.precoUnitario !== undefined ? `- R$ ${(i.quantidade * i.precoUnitario).toFixed(2)}` : ''}
                </li>`).join('');
            
            const dataFormatada = p.dataPedido ? new Date(p.dataPedido).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'Data indisponível';


            card.innerHTML = `
                <div class="card-header">
                    Pedido #${p.id} - ${dataFormatada}
                </div>
                <ul class="list-group list-group-flush">${itensHtml}</ul>
                <div class="card-footer text-end small">
                    <button class="btn btn-sm btn-primary ms-2" onclick="imprimirPedido(${p.id})"><i class="bi bi-printer"></i> Imprimir</button>
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
        // alert("Erro ao carregar pedidos.");
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
        await axios.put(`/api/pedidos/${id}/status`, { novoStatus }, {
            headers: { 'Content-Type': 'application/json' }
        });
        // Opcional: feedback visual imediato antes do reload completo
        const cardFooter = document.querySelector(`#pedido-${id} .card-footer strong`);
        if (cardFooter) cardFooter.textContent = novoStatus;
        carregarPedidos(); // Recarrega para garantir consistência e atualizar contadores
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status.');
        carregarPedidos(); // Recarrega para reverter visualmente em caso de erro
    }
}

function formatarPedidoParaImpressao(pedido) {
    let texto = `Pedido #${pedido.id}\n`;
    texto += `Data: ${new Date(pedido.dataPedido).toLocaleString('pt-BR')}\n`;
    texto += `Status: ${pedido.status}\n\n`;
    texto += `Itens:\n`;
    let totalPedido = 0;

    pedido.itens.forEach(item => {
        const nomeProduto = item.produto || 'Produto desconhecido';
        const totalItem = item.quantidade * item.precoUnitario;
        totalPedido += totalItem;
        texto += `${item.quantidade}x ${nomeProduto.padEnd(30, ' ')} R$ ${totalItem.toFixed(2)}\n`;
    });

    texto += `\nTotal do Pedido: R$ ${totalPedido.toFixed(2)}\n`;
    texto += `\n--------------------------------\n`;
    return texto;
}

async function imprimirPedido(idPedido) {
    try {
        const res = await axios.get(`/api/pedidos/${idPedido}`);
        const pedido = res.data;
        const textoImpressao = formatarPedidoParaImpressao(pedido);
        const janelaImpressao = window.open('', '_blank', 'width=400,height=600'); // Janela menor para cupom
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
                            // window.close(); // Descomente se quiser fechar a janela automaticamente após imprimir
                        }
                    </script>
                </body>
                </html>
            `);
            janelaImpressao.document.close();
            // janelaImpressao.focus(); // O foco pode ser desnecessário dependendo do navegador
        } else {
            alert('Não foi possível abrir a janela de impressão. Verifique as configurações do navegador (bloqueador de pop-ups).');
        }
    } catch (err) {
        console.error('Erro ao carregar os dados do pedido para impressão:', err);
        alert('Erro ao carregar os dados do pedido para impressão.');
    }
}

async function concluirPedido(idPedido) {
    try {
        await axios.put(`/api/pedidos/${idPedido}/status`, { novoStatus: 'Entregue' }, {
            headers: { 'Content-Type': 'application/json' }
        });
        // alert('Pedido concluído com sucesso!'); // Pode ser substituído por feedback menos intrusivo
        carregarPedidos(); // Recarrega para remover o card da tela KDS
    } catch (err) {
        console.error('Erro ao concluir o pedido:', err);
        alert('Erro ao concluir o pedido.');
    }
}

window.onload = () => {
    carregarPedidos();
    setInterval(carregarPedidos, KDS_UPDATE_INTERVAL); // Atualiza o KDS periodicamente
};

// Adiciona listener para o evento dragend para limpar a classe 'dragging'
document.addEventListener('dragend', (event) => {
    if (event.target.classList.contains('dragging')) {
        event.target.classList.remove('dragging');
    }
}, false);