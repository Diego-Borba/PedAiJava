document.addEventListener('DOMContentLoaded', function() {
    const loadingEl = document.getElementById('loading');
    const notLoggedInEl = document.getElementById('notLoggedIn');
    const containerEl = document.getElementById('pedidosContainer');
    const CUSTOMER_STORAGE_KEY = 'pedAiCustomer';

    function getCustomerFromStorage() {
        const storedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        try {
            return JSON.parse(storedCustomer);
        } catch (e) {
            return null;
        }
    }

    async function carregarPedidos() {
        const cliente = getCustomerFromStorage();

        if (!cliente || !cliente.id) {
            loadingEl.style.display = 'none';
            notLoggedInEl.style.display = 'block';
            containerEl.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/pedidos/por-cliente/${cliente.id}`);
            if (!response.ok) {
                throw new Error('Não foi possível carregar seus pedidos.');
            }
            const pedidos = await response.json();
            
            loadingEl.style.display = 'none';
            containerEl.innerHTML = ''; 

            if (pedidos.length === 0) {
                containerEl.innerHTML = '<p class="text-center text-muted mt-4">Você ainda não fez nenhum pedido.</p>';
                return;
            }

            pedidos.forEach(pedido => {
                const dataFormatada = new Date(pedido.dataPedido).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const itensHtml = pedido.itens.map(item => `
                    <li>${item.quantidade}x ${item.produtoNome} - R$ ${item.subtotal.toFixed(2)}</li>
                `).join('');

                const accordionItem = `
                    <div class="accordion-item mb-3 shadow-sm pedido-card">
                        <h2 class="accordion-header" id="heading-${pedido.id}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${pedido.id}">
                                Pedido #${pedido.id} - ${dataFormatada} &nbsp; | &nbsp; <strong class="ms-1">Status: ${pedido.status}</strong>
                            </button>
                        </h2>
                        <div id="collapse-${pedido.id}" class="accordion-collapse collapse" data-bs-parent="#pedidosContainer">
                            <div class="accordion-body">
                                <h6>Itens do Pedido:</h6>
                                <ul>${itensHtml}</ul>
                                <hr>
                                <p class="text-end fw-bold fs-5">Total do Pedido: <span style="color: #ff5722;">R$ ${pedido.total.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </div>
                `;
                containerEl.innerHTML += accordionItem;
            });

        } catch (error) {
            loadingEl.style.display = 'none';
            containerEl.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
        }
    }

    carregarPedidos();
});