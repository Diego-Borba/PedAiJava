package com.PedAi.PedAi.Model;

import jakarta.persistence.Embeddable;

@Embeddable
public class ComplementoConfig {

    private Long complementoProdutoId; // ID do Produto que atua como complemento
    private Integer maxQtdePermitida;   // Quantidade máxima deste complemento para o produto principal

    public ComplementoConfig() {
    }

    public ComplementoConfig(Long complementoProdutoId, Integer maxQtdePermitida) {
        this.complementoProdutoId = complementoProdutoId;
        this.maxQtdePermitida = maxQtdePermitida;
    }

    public Long getComplementoProdutoId() {
        return complementoProdutoId;
    }

    public void setComplementoProdutoId(Long complementoProdutoId) {
        this.complementoProdutoId = complementoProdutoId;
    }

    public Integer getMaxQtdePermitida() {
        return maxQtdePermitida;
    }

    public void setMaxQtdePermitida(Integer maxQtdePermitida) {
        this.maxQtdePermitida = maxQtdePermitida;
    }
}