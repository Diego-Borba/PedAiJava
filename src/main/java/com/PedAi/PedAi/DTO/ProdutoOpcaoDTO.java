package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Produto;

public class ProdutoOpcaoDTO {
    private Long id;
    private String nome;

    public ProdutoOpcaoDTO(Produto produto) {
        this.id = produto.getId();
        this.nome = produto.getNome();
    }

    // Getters
    public Long getId() { return id; }
    public String getNome() { return nome; }
}