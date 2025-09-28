package com.PedAi.PedAi.Model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "timestamp with time zone")
    private ZonedDateTime dataPedido = ZonedDateTime.now(ZoneOffset.UTC);

    private String status;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> itens = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Embedded
    private Endereco enderecoEntrega;

    // --- NOVOS CAMPOS ADICIONADOS ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'ENTREGA'")
    private TipoPedido tipo;

    @Column(columnDefinition = "timestamp with time zone")
    private ZonedDateTime dataAgendamento; // Usado para encomendas

    private String formaPagamento; // Campo que faltava para armazenar a forma de pagamento

    // --- FIM DOS NOVOS CAMPOS ---

    // Getters e Setters
    public BigDecimal getTotal() {
        return itens.stream()
                .map(ItemPedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ZonedDateTime getDataPedido() { return dataPedido; }
    public void setDataPedido(ZonedDateTime dataPedido) { this.dataPedido = dataPedido; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<ItemPedido> getItens() { return itens; }
    public void setItens(List<ItemPedido> itens) { this.itens = itens; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Endereco getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(Endereco enderecoEntrega) { this.enderecoEntrega = enderecoEntrega; }
    public TipoPedido getTipo() { return tipo; }
    public void setTipo(TipoPedido tipo) { this.tipo = tipo; }
    public ZonedDateTime getDataAgendamento() { return dataAgendamento; }
    public void setDataAgendamento(ZonedDateTime dataAgendamento) { this.dataAgendamento = dataAgendamento; }
    public String getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(String formaPagamento) { this.formaPagamento = formaPagamento; }
}