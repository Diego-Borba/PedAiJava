package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;

public class ProdutoSearchDTO {

    private Long id;
    private String text; // Formato esperado pela biblioteca Select2

    public ProdutoSearchDTO(Produto produto) {
        this.id = produto.getId();
        // Formata o texto de exibição para incluir nome e código PDV
        this.text = produto.getNome() + (produto.getCodPdv() != null ? " (PDV: " + produto.getCodPdv() + ")" : "");
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}