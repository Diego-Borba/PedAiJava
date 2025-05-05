package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;

public class EntradaItemDTO {
    private Long produtoId;
    private BigDecimal quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal fatorEntrada;

    // Getters e Setters

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }

    public void setPrecoUnitario(BigDecimal precoUnitario) {
        this.precoUnitario = precoUnitario;
    }

    public BigDecimal getFatorEntrada() {
        return fatorEntrada;
    }

    public void setFatorEntrada(BigDecimal fatorEntrada) {
        this.fatorEntrada = fatorEntrada;
    }
}
