package com.PedAi.PedAi.Model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
public class Entrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dataEntrada;

    private String tipoDocumento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @OneToMany(mappedBy = "entrada", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntradaItem> itens;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorTotalDocumento;

    private String formaPagamento;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDataEntrada() {
        return dataEntrada;
    }

    public void setDataEntrada(LocalDate dataEntrada) {
        this.dataEntrada = dataEntrada;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public List<EntradaItem> getItens() {
        return itens;
    }

    public void setItens(List<EntradaItem> itens) {
        this.itens = itens;
    }

    public BigDecimal getValorTotalDocumento() {
        return valorTotalDocumento;
    }

    public void setValorTotalDocumento(BigDecimal valorTotalDocumento) {
        this.valorTotalDocumento = valorTotalDocumento;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }
}
