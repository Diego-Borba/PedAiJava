package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.OpcaoComplemento;

public class OpcaoCardapioDTO {
    private Long id;
    private ProdutoOpcaoDTO produto;

    public OpcaoCardapioDTO(OpcaoComplemento opcao) {
        this.id = opcao.getId();
        this.produto = new ProdutoOpcaoDTO(opcao.getProduto());
    }
    
    public Long getId() { return id; }
    public ProdutoOpcaoDTO getProduto() { return produto; }
}