package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.TipoPedido;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

// DTO para exibir pedidos na nova tela de gestão
public class PedidoAdminDTO {
    private Long id;
    private ZonedDateTime dataPedido;
    private ZonedDateTime dataAgendamento;
    private String status;
    private TipoPedido tipo;
    private Long clienteId; // CAMPO ADICIONADO
    private String clienteNome;
    private String endereco;
    private String formaPagamento;
    private BigDecimal total;
    private List<String> itens;

    public PedidoAdminDTO(Pedido pedido) {
        this.id = pedido.getId();
        this.dataPedido = pedido.getDataPedido();
        this.dataAgendamento = pedido.getDataAgendamento();
        this.status = pedido.getStatus();
        this.tipo = pedido.getTipo();
        this.formaPagamento = pedido.getFormaPagamento();
        this.total = pedido.getTotal();
        
        if (pedido.getCliente() != null) {
            this.clienteId = pedido.getCliente().getId(); // LÓGICA ADICIONADA
            this.clienteNome = pedido.getCliente().getNome();
        } else {
            this.clienteNome = "Cliente não informado";
        }

        if (pedido.getEnderecoEntrega() != null) {
            this.endereco = pedido.getEnderecoEntrega().getLogradouro() + ", " + pedido.getEnderecoEntrega().getNumero();
        } else {
            this.endereco = "Retirada no local";
        }
        
        this.itens = pedido.getItens().stream()
                .map(item -> item.getQuantidade() + "x " + item.getProduto().getNome())
                .collect(Collectors.toList());
    }

    // Getters
    public Long getId() { return id; }
    public ZonedDateTime getDataPedido() { return dataPedido; }
    public ZonedDateTime getDataAgendamento() { return dataAgendamento; }
    public String getStatus() { return status; }
    public TipoPedido getTipo() { return tipo; }
    public Long getClienteId() { return clienteId; } // GETTER ADICIONADO
    public String getClienteNome() { return clienteNome; }
    public String getEndereco() { return endereco; }
    public String getFormaPagamento() { return formaPagamento; }
    public BigDecimal getTotal() { return total; }
    public List<String> getItens() { return itens; }
}