package com.PedAi.PedAi.Model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Venda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "timestamp with time zone")
    private ZonedDateTime dataVenda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemVenda> itens = new ArrayList<>();

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PagamentoVenda> pagamentos = new ArrayList<>();

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal acrescimo = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ZonedDateTime getDataVenda() {
        return dataVenda;
    }

    public void setDataVenda(ZonedDateTime dataVenda) {
        this.dataVenda = dataVenda;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public List<ItemVenda> getItens() {
        return itens;
    }

    public void setItens(List<ItemVenda> itens) {
        this.itens = itens;
    }

    public List<PagamentoVenda> getPagamentos() {
        return pagamentos;
    }

    public void setPagamentos(List<PagamentoVenda> pagamentos) {
        this.pagamentos = pagamentos;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public void setDesconto(BigDecimal desconto) {
        this.desconto = desconto;
    }

    public BigDecimal getAcrescimo() {
        return acrescimo;
    }

    public void setAcrescimo(BigDecimal acrescimo) {
        this.acrescimo = acrescimo;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}