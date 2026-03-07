package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;

public class ProdutoSearchDTO {

    private Long id;
    private String text; 

    public ProdutoSearchDTO(Produto produto) {
        this.id = produto.getId();
        this.text = produto.getNome() + (produto.getCodPdv() != null ? " (PDV: " + produto.getCodPdv() + ")" : "");
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}