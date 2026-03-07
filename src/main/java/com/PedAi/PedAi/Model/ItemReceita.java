package com.PedAi.PedAi.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

@Embeddable
public class ItemReceita {

    private Long produtoIngredienteId;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidadeUtilizada;

    public ItemReceita() {
    }

    public Long getProdutoIngredienteId() {
        return produtoIngredienteId;
    }

    public void setProdutoIngredienteId(Long produtoIngredienteId) {
        this.produtoIngredienteId = produtoIngredienteId;
    }

    public BigDecimal getQuantidadeUtilizada() {
        return quantidadeUtilizada;
    }

    public void setQuantidadeUtilizada(BigDecimal quantidadeUtilizada) {
        this.quantidadeUtilizada = quantidadeUtilizada;
    }
}