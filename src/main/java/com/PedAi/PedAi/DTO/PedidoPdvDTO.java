package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.Pedido;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class PedidoPdvDTO {

    private Long id;
    private String clienteNome;
    private BigDecimal total;
    private List<ItemPedidoPdvDTO> itens;

    public PedidoPdvDTO(Pedido pedido) {
        this.id = pedido.getId();
        this.clienteNome = pedido.getCliente() != null ? pedido.getCliente().getNome() : "Cliente não identificado";
        this.total = pedido.getTotal();
        this.itens = pedido.getItens().stream().map(ItemPedidoPdvDTO::new).collect(Collectors.toList());
    }

    // Getters
    public Long getId() { return id; }
    public String getClienteNome() { return clienteNome; }
    public BigDecimal getTotal() { return total; }
    public List<ItemPedidoPdvDTO> getItens() { return itens; }

    // Inner DTO for items
    public static class ItemPedidoPdvDTO {
        private Long produtoId;
        private String produtoNome;
        private int quantidade;
        private BigDecimal precoUnitario;

        public ItemPedidoPdvDTO(ItemPedido itemPedido) {
            this.produtoId = itemPedido.getProduto().getId();
            this.produtoNome = itemPedido.getProduto().getNome();
            this.quantidade = itemPedido.getQuantidade();
            this.precoUnitario = itemPedido.getPrecoUnitario();
        }

        // Getters
        public Long getProdutoId() { return produtoId; }
        public String getProdutoNome() { return produtoNome; }
        public int getQuantidade() { return quantidade; }
        public BigDecimal getPrecoUnitario() { return precoUnitario; }
    }
}