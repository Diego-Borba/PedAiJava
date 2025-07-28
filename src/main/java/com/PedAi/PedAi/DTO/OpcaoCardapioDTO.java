package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.OpcaoComplemento;

// DTO para uma opção dentro de um grupo de kit no cardápio
public class OpcaoCardapioDTO {
    private Long id;
    private ProdutoOpcaoDTO produto;

    public OpcaoCardapioDTO(OpcaoComplemento opcao) {
        this.id = opcao.getId();
        this.produto = new ProdutoOpcaoDTO(opcao.getProduto());
    }
    
    // Getters
    public Long getId() { return id; }
    public ProdutoOpcaoDTO getProduto() { return produto; }
}