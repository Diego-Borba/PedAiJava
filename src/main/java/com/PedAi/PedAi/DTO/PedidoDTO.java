package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Endereco; // IMPORTANTE: Importar a classe Endereco
import java.util.List;

public class PedidoDTO {

    private Long clienteId;
    private List<ItemPedidoDTO> itens;
    private Endereco enderecoEntrega; // ADICIONADO
    private String formaPagamento;   // ADICIONADO

    // Getters e Setters para TODOS os campos

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public List<ItemPedidoDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemPedidoDTO> itens) {
        this.itens = itens;
    }

    public Endereco getEnderecoEntrega() {
        return enderecoEntrega;
    }

    public void setEnderecoEntrega(Endereco enderecoEntrega) {
        this.enderecoEntrega = enderecoEntrega;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }
}