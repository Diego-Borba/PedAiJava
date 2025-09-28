package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Endereco;
import com.PedAi.PedAi.Model.TipoPedido;
import java.time.ZonedDateTime; 
import java.util.List;

public class PedidoDTO {

    private Long clienteId;
    private List<ItemPedidoDTO> itens;
    private Endereco enderecoEntrega;
    private String formaPagamento;
    
    private TipoPedido tipo;
    private ZonedDateTime dataAgendamento;

    
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public List<ItemPedidoDTO> getItens() { return itens; }
    public void setItens(List<ItemPedidoDTO> itens) { this.itens = itens; }
    public Endereco getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(Endereco enderecoEntrega) { this.enderecoEntrega = enderecoEntrega; }
    public String getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(String formaPagamento) { this.formaPagamento = formaPagamento; }
    public TipoPedido getTipo() { return tipo; }
    public void setTipo(TipoPedido tipo) { this.tipo = tipo; }
    public ZonedDateTime getDataAgendamento() { return dataAgendamento; }
    public void setDataAgendamento(ZonedDateTime dataAgendamento) { this.dataAgendamento = dataAgendamento; }
}