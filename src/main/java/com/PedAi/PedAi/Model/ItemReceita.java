package com.PedAi.PedAi.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

@Embeddable // Indica que esta classe será embutida em outra entidade (Produto)
public class ItemReceita {

    private Long produtoIngredienteId; // ID do Produto que é o ingrediente

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidadeUtilizada; // Qtde do ingrediente usada na receita

    public ItemReceita() {
    }

    // Getters e Setters
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