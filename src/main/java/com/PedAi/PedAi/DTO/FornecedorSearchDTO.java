package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Fornecedor;

public class FornecedorSearchDTO {

    private Long id;
    private String text;

    public FornecedorSearchDTO(Fornecedor fornecedor) {
        this.id = fornecedor.getId();
        this.text = fornecedor.getNome();
    }
    
    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}